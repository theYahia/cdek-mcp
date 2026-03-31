import { z } from "zod";
import { CdekClient } from "../client.js";
import type { TariffResult } from "../types.js";

const client = new CdekClient();

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
  const result = (await client.post("/calculator/tariff", params)) as TariffResult;

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
