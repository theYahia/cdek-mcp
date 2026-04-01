import { z } from "zod";
import { getClient } from "../client.js";
import type { CdekPrintResponse } from "../types.js";

export const printReceiptSchema = z.object({
  order_uuid: z.string().describe("UUID заказа для печати квитанции"),
  copy_count: z.number().int().min(1).max(10).default(1).describe("Количество копий (1-10)"),
});

export async function handlePrintReceipt(params: z.infer<typeof printReceiptSchema>): Promise<string> {
  const createResult = (await getClient().post("/print/orders", {
    orders: [{ order_uuid: params.order_uuid }],
    copy_count: params.copy_count,
  })) as CdekPrintResponse;

  if (createResult.errors && createResult.errors.length > 0) {
    const msgs = createResult.errors.map(e => `[${e.code}] ${e.message}`).join("; ");
    return `Ошибка создания квитанции: ${msgs}`;
  }

  const printUuid = createResult.entity?.uuid;
  if (!printUuid) {
    return "Не удалось создать квитанцию: UUID не получен.";
  }

  // Poll for URL (up to 5 attempts)
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const getResult = (await getClient().get(`/print/orders/${printUuid}`)) as CdekPrintResponse;

    if (getResult.entity?.url) {
      return JSON.stringify({
        uuid: printUuid,
        url: getResult.entity.url,
        сообщение: "Квитанция готова к скачиванию.",
      }, null, 2);
    }

    const status = getResult.entity?.statuses?.[0];
    if (status && status.code === "FAIL") {
      return `Ошибка формирования квитанции: ${status.name}`;
    }
  }

  return JSON.stringify({
    uuid: printUuid,
    сообщение: "Квитанция формируется. Проверьте позже по UUID.",
  }, null, 2);
}
