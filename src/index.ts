#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { calculateTariffSchema, handleCalculateTariff } from "./tools/calculate.js";
import { getCitiesSchema, handleGetCities, listPvzSchema, handleListPvz } from "./tools/locations.js";
import { createOrderSchema, handleCreateOrder, getOrderSchema, handleGetOrder } from "./tools/orders.js";
import { trackSchema, handleTrack } from "./tools/tracking.js";

const server = new McpServer({ name: "cdek-mcp", version: "1.0.1" });

server.tool("calculate_tariff", "Расчёт стоимости и сроков доставки СДЭК по тарифу, маршруту и параметрам груза.", calculateTariffSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCalculateTariff(params) }] }));

server.tool("create_order", "Создание заказа на доставку СДЭК с указанием отправителя, получателя и мест.", createOrderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCreateOrder(params) }] }));

server.tool("get_order", "Получение информации о заказе СДЭК по UUID.", getOrderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetOrder(params) }] }));

server.tool("track", "Отслеживание отправления СДЭК по номеру.", trackSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleTrack(params) }] }));

server.tool("get_cities", "Поиск городов в справочнике СДЭК по названию, индексу или стране.", getCitiesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetCities(params) }] }));

server.tool("list_pvz", "Поиск пунктов выдачи и постаматов СДЭК по городу или индексу.", listPvzSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListPvz(params) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cdek-mcp] Сервер запущен. 6 инструментов.");
}

main().catch((error) => { console.error("[cdek-mcp] Ошибка:", error); process.exit(1); });
