import { z } from "zod";
import { CdekClient } from "../client.js";
import type { CdekCity, CdekDeliveryPoint, CdekRegion } from "../types.js";

const client = new CdekClient();

export const getCitiesSchema = z.object({
  city: z.string().optional().describe("Название города (поиск по подстроке)"),
  postal_code: z.string().optional().describe("Почтовый индекс"),
  code: z.number().optional().describe("Код города СДЭК"),
  country_codes: z.string().optional().describe("Коды стран через запятую (например RU,KZ)"),
  size: z.number().int().min(1).max(1000).default(50).describe("Количество результатов (по умолчанию 50)"),
  page: z.number().int().min(0).default(0).describe("Номер страницы (с 0)"),
});

export const getRegionsSchema = z.object({
  country_codes: z.string().optional().describe("Коды стран через запятую (например RU,KZ)"),
  region: z.string().optional().describe("Название региона (поиск по подстроке)"),
  size: z.number().int().min(1).max(1000).default(50).describe("Количество результатов"),
  page: z.number().int().min(0).default(0).describe("Номер страницы (с 0)"),
});

export const listDeliveryPointsSchema = z.object({
  city_code: z.number().optional().describe("Код города СДЭК"),
  postal_code: z.string().optional().describe("Почтовый индекс"),
  type: z.enum(["PVZ", "POSTAMAT", "ALL"]).default("ALL").describe("Тип пункта: PVZ (пункт выдачи), POSTAMAT (постамат), ALL"),
  country_code: z.string().default("RU").describe("Код страны (по умолчанию RU)"),
  latitude: z.number().optional().describe("Широта для поиска ближайших"),
  longitude: z.number().optional().describe("Долгота для поиска ближайших"),
  radius: z.number().optional().describe("Радиус поиска в км (работает с lat/lng)"),
  size: z.number().int().min(1).max(1000).default(50).describe("Количество результатов"),
  page: z.number().int().min(0).default(0).describe("Номер страницы (с 0)"),
});

export async function handleGetCities(params: z.infer<typeof getCitiesSchema>): Promise<string> {
  const query: Record<string, string> = {};
  if (params.city) query.city = params.city;
  if (params.postal_code) query.postal_code = params.postal_code;
  if (params.code !== undefined) query.code = String(params.code);
  if (params.country_codes) query.country_codes = params.country_codes;
  query.size = String(params.size);
  query.page = String(params.page);

  const result = (await client.get("/location/cities", query)) as CdekCity[];

  if (!Array.isArray(result) || result.length === 0) {
    return "Города не найдены по заданным параметрам.";
  }

  return JSON.stringify(result.map(c => ({
    код: c.code,
    город: c.city,
    регион: c.region,
    страна: c.country_code,
    индекс_фиас: c.fias_guid,
  })), null, 2);
}

export async function handleGetRegions(params: z.infer<typeof getRegionsSchema>): Promise<string> {
  const query: Record<string, string> = {};
  if (params.country_codes) query.country_codes = params.country_codes;
  if (params.region) query.region = params.region;
  query.size = String(params.size);
  query.page = String(params.page);

  const result = (await client.get("/location/regions", query)) as CdekRegion[];

  if (!Array.isArray(result) || result.length === 0) {
    return "Регионы не найдены по заданным параметрам.";
  }

  return JSON.stringify(result.map(r => ({
    регион: r.region,
    код_региона: r.region_code,
    страна: r.country,
    код_страны: r.country_code,
  })), null, 2);
}

export async function handleListDeliveryPoints(params: z.infer<typeof listDeliveryPointsSchema>): Promise<string> {
  const query: Record<string, string> = {};
  if (params.city_code) query.city_code = String(params.city_code);
  if (params.postal_code) query.postal_code = params.postal_code;
  if (params.type !== "ALL") query.type = params.type;
  query.country_code = params.country_code;
  if (params.latitude !== undefined) query.latitude = String(params.latitude);
  if (params.longitude !== undefined) query.longitude = String(params.longitude);
  if (params.radius !== undefined) query.radius = String(params.radius);
  query.size = String(params.size);
  query.page = String(params.page);

  const result = (await client.get("/deliverypoints", query)) as CdekDeliveryPoint[];

  if (!Array.isArray(result) || result.length === 0) {
    return "Пункты выдачи не найдены по заданным параметрам.";
  }

  return JSON.stringify(result.map(p => ({
    код: p.code,
    название: p.name,
    тип: p.type,
    город: p.location.city,
    адрес: p.location.address,
    индекс: p.location.postal_code,
    координаты: { широта: p.location.latitude, долгота: p.location.longitude },
    время_работы: p.work_time,
    примерочная: p.is_dressing_room,
    наличные: p.have_cash,
    безнал: p.have_cashless,
  })), null, 2);
}
