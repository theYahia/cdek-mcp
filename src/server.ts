/**
 * Server factory — creates and configures the MCP server with all 8 tools.
 * Separated from transport logic so it can be tested independently.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { calculateTariffSchema, handleCalculateTariff } from "./tools/calculate.js";
import { getCitiesSchema, handleGetCities, listDeliveryPointsSchema, handleListDeliveryPoints } from "./tools/locations.js";
import { createOrderSchema, handleCreateOrder, getOrderSchema, handleGetOrder, deleteOrderSchema, handleDeleteOrder } from "./tools/orders.js";
import { trackShipmentSchema, handleTrackShipment } from "./tools/tracking.js";
import { generateBarcodeSchema, handleGenerateBarcode } from "./tools/barcode.js";

const VERSION = "1.1.0";

export function createServer(): McpServer {
  const server = new McpServer({ name: "cdek-mcp", version: VERSION });

  server.tool(
    "calculate_tariff",
    "Расчёт стоимости и сроков доставки СДЭК по тарифу, маршруту и параметрам груза.",
    calculateTariffSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCalculateTariff(params) }] }),
  );

  server.tool(
    "create_order",
    "Создание заказа на доставку СДЭК с указанием отправителя, получателя и мест.",
    createOrderSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCreateOrder(params) }] }),
  );

  server.tool(
    "get_order",
    "Получение информации о заказе СДЭК по UUID.",
    getOrderSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetOrder(params) }] }),
  );

  server.tool(
    "track_shipment",
    "Отслеживание отправления СДЭК по номеру накладной.",
    trackShipmentSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleTrackShipment(params) }] }),
  );

  server.tool(
    "list_delivery_points",
    "Поиск пунктов выдачи и постаматов СДЭК по городу или индексу.",
    listDeliveryPointsSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleListDeliveryPoints(params) }] }),
  );

  server.tool(
    "get_cities",
    "Поиск городов в справочнике СДЭК по названию, индексу или стране.",
    getCitiesSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetCities(params) }] }),
  );

  server.tool(
    "generate_barcode",
    "Генерация штрихкода для заказа СДЭК по UUID.",
    generateBarcodeSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGenerateBarcode(params) }] }),
  );

  server.tool(
    "delete_order",
    "Удаление заказа СДЭК по UUID.",
    deleteOrderSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleDeleteOrder(params) }] }),
  );

  return server;
}
