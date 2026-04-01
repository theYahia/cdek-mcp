import { z } from "zod";
import { getClient } from "../client.js";
import type { TariffResult, TariffListResult } from "../types.js";

const locationSchema = z.object({
  code: z.number().optional().describe("Код города СДЭК"),
  postal_code: z.string().optional().describe("Почтовый индекс"),
  address: z.string().optional().describe("Адрес"),
});

const packageSchema = z.object({
  weight: z.number().positive().describe("Вес в граммах"),
  length: z.number().positive().optional().describe("Длина в см"),
  width: z.number().positive().optional().describe("Ширина в см"),
  height: z.number().positive().optional().describe("Высота в см"),
});

export const calculateTariffSchema = z.object({
  from_location: z.object({
    code: z.number().optional().describe("Код города отправителя СДЭК"),
    postal_code: z.string().optional().describe("Почтовый индекс отправителя"),
    address: z.string().optional().describe("Адрес отправителя"),
  }).describe("Место отправления (code или postal_code обязательно)"),
  to_location: z.object({
    code: z.number().optional().describe("Код города получателя СДЭК"),
    postal_code: z.string().optional().describe("Почтовый индекс получателя"),
    address: z.string().optional().describe("Адрес получателя"),
  }).describe("Место назначения (code или postal_code обязательно)"),
  tariff_code: z.number().describe("Код тарифа СДЭК (например 136=посылка склад-склад, 137=склад-дверь, 138=дверь-склад, 139=дверь-дверь)"),
  packages: z.array(z.object({
    weight: z.number().positive().describe("Вес в граммах"),
    length: z.number().positive().optional().describe("Длина в см"),
    width: z.number().positive().optional().describe("Ширина в см"),
    height: z.number().positive().optional().describe("Высота в см"),
  })).min(1).describe("Список мест (минимум 1)"),
});

export async function handleCalculateTariff(params: z.infer<typeof calculateTariffSchema>): Promise<string> {
  const result = (await getClient().post("/calculator/tariff", params)) as TariffResult;

  if (result.errors && result.errors.length > 0) {
    const msgs = result.errors.map(e => `[${e.code}] ${e.message}`).join("; ");
    return `Ошибка расчёта: ${msgs}`;
  }

  return JSON.stringify({
    стоимость_доставки: result.delivery_sum,
    срок_мин_дней: result.period_min,
    срок_макс_дней: result.period_max,
    расчётный_вес_г: result.weight_calc,
    валюта: result.currency,
  }, null, 2);
}

export const calculateTariffListSchema = z.object({
  from_location: locationSchema.describe("Место отправления (code или postal_code обязательно)"),
  to_location: locationSchema.describe("Место назначения (code или postal_code обязательно)"),
  packages: z.array(packageSchema).min(1).describe("Список мест (минимум 1)"),
  currency: z.number().optional().describe("Код валюты (1=RUB, 2=KZT, 3=USD, 4=EUR)"),
});

export async function handleCalculateTariffList(params: z.infer<typeof calculateTariffListSchema>): Promise<string> {
  const result = (await getClient().post("/calculator/tarifflist", params)) as TariffListResult;

  if (result.errors && result.errors.length > 0) {
    const msgs = result.errors.map(e => `[${e.code}] ${e.message}`).join("; ");
    return `Ошибка расчёта: ${msgs}`;
  }

  const tariffs = result.tariff_codes ?? [];
  if (tariffs.length === 0) {
    return "Нет доступных тарифов для данного маршрута и параметров груза.";
  }

  return JSON.stringify(tariffs.map(t => ({
    код_тарифа: t.tariff_code,
    название: t.tariff_name,
    описание: t.tariff_description,
    режим_доставки: t.delivery_mode,
    стоимость: t.delivery_sum,
    срок_мин: t.period_min,
    срок_макс: t.period_max,
  })), null, 2);
}
