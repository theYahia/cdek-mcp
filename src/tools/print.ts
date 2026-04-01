import { z } from "zod";
import { CdekClient } from "../client.js";
import type { CdekPrintResponse } from "../types.js";

const client = new CdekClient();

export const printBarcodeSchema = z.object({
  order_uuid: z.string().describe("UUID заказа для печати штрихкода"),
  copy_count: z.number().int().min(1).max(10).default(1).describe("Количество копий (1-10)"),
});

export const printReceiptSchema = z.object({
  order_uuid: z.string().describe("UUID заказа для печати квитанции"),
  copy_count: z.number().int().min(1).max(10).default(1).describe("Количество копий (1-10)"),
});

async function handlePrint(endpoint: string, params: { order_uuid: string; copy_count: number }, label: string): Promise<string> {
  // Step 1: Create print request
  const createResult = (await client.post(endpoint, {
    orders: [{ order_uuid: params.order_uuid }],
    copy_count: params.copy_count,
  })) as CdekPrintResponse;

  if (createResult.errors && createResult.errors.length > 0) {
    const msgs = createResult.errors.map(e => `[${e.code}] ${e.message}`).join("; ");
    return `Ошибка создания ${label}: ${msgs}`;
  }

  const printUuid = createResult.entity?.uuid;
  if (!printUuid) {
    return `Не удалось создать ${label}: UUID не получен.`;
  }

  // Step 2: Poll for URL (up to 5 attempts)
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const getResult = (await client.get(`${endpoint}/${printUuid}`)) as CdekPrintResponse;

    if (getResult.entity?.url) {
      return JSON.stringify({
        uuid: printUuid,
        url: getResult.entity.url,
        сообщение: `${label} готов к скачиванию.`,
      }, null, 2);
    }

    const status = getResult.entity?.statuses?.[0];
    if (status && status.code === "FAIL") {
      return `Ошибка формирования ${label}: ${status.name}`;
    }
  }

  return JSON.stringify({
    uuid: printUuid,
    сообщение: `${label} формируется. Проверьте позже по UUID.`,
  }, null, 2);
}

export async function handlePrintBarcode(params: z.infer<typeof printBarcodeSchema>): Promise<string> {
  return handlePrint("/print/barcodes", params, "Штрихкод");
}

export async function handlePrintReceipt(params: z.infer<typeof printReceiptSchema>): Promise<string> {
  return handlePrint("/print/orders", params, "Квитанция");
}
