import { z } from "zod";
import { CdekClient } from "../client.js";
import type { CdekWebhook } from "../types.js";

const client = new CdekClient();

export const createWebhookSchema = z.object({
  url: z.string().url().describe("URL для получения уведомлений (HTTPS)"),
  type: z.enum(["ORDER_STATUS", "DOWNLOAD_PHOTO"]).describe("Тип вебхука: ORDER_STATUS (статусы заказов) или DOWNLOAD_PHOTO (фото при получении)"),
});

export async function handleCreateWebhook(params: z.infer<typeof createWebhookSchema>): Promise<string> {
  const result = (await client.post("/webhooks", params)) as CdekWebhook;

  if (result.errors && result.errors.length > 0) {
    const msgs = result.errors.map(e => `[${e.code}] ${e.message}`).join("; ");
    return `Ошибка создания вебхука: ${msgs}`;
  }

  return JSON.stringify({
    uuid: result.entity?.uuid,
    url: result.entity?.url,
    тип: result.entity?.type,
    статус_запроса: result.requests?.[0]?.state,
    сообщение: "Вебхук создан. СДЭК будет отправлять POST-уведомления на указанный URL.",
  }, null, 2);
}
