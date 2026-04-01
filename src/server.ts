/**
 * Server factory — creates and configures the MCP server with all 14 tools.
 * Separated from transport logic so it can be tested independently.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { calculateTariffSchema, handleCalculateTariff, calculateTariffListSchema, handleCalculateTariffList } from "./tools/calculate.js";
import { getCitiesSchema, handleGetCities, getRegionsSchema, handleGetRegions, listDeliveryPointsSchema, handleListDeliveryPoints } from "./tools/locations.js";
import { createOrderSchema, handleCreateOrder, getOrderSchema, handleGetOrder, deleteOrderSchema, handleDeleteOrder } from "./tools/orders.js";
import { trackShipmentSchema, handleTrackShipment } from "./tools/tracking.js";
import { generateBarcodeSchema, handleGenerateBarcode } from "./tools/barcode.js";
import { createIntakeSchema, handleCreateIntake, getIntakeSchema, handleGetIntake } from "./tools/intake.js";
import { printReceiptSchema, handlePrintReceipt } from "./tools/print.js";
import { createWebhookSchema, handleCreateWebhook } from "./tools/webhooks.js";

const VERSION = "2.0.0";

function wrap(handler: (params: any) => Promise<string>) {
  return async (params: any) => {
    try {
      const text = await handler(params);
      return { content: [{ type: "text" as const, text }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text" as const, text: `Ошибка: ${message}` }], isError: true };
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "cdek-mcp", version: VERSION });

  // Tariffs (2)
  server.tool("calculate_tariff",
    "Calculate CDEK delivery cost and time for a specific tariff, route, and package dimensions.",
    calculateTariffSchema.shape, wrap(handleCalculateTariff));

  server.tool("calculate_tariff_list",
    "Get all available CDEK tariffs with prices for a route and package. Returns a comparison list.",
    calculateTariffListSchema.shape, wrap(handleCalculateTariffList));

  // Orders (3)
  server.tool("create_order",
    "Create a CDEK delivery order with sender, recipient, packages, and tariff.",
    createOrderSchema.shape, wrap(handleCreateOrder));

  server.tool("get_order",
    "Get CDEK order details and status by UUID.",
    getOrderSchema.shape, wrap(handleGetOrder));

  server.tool("delete_order",
    "Delete/cancel a CDEK order by UUID. Only works before the order is processed.",
    deleteOrderSchema.shape, wrap(handleDeleteOrder));

  // Tracking (1)
  server.tool("track_shipment",
    "Track a CDEK shipment by waybill number. Returns full status history.",
    trackShipmentSchema.shape, wrap(handleTrackShipment));

  // Locations (3)
  server.tool("get_cities",
    "Search CDEK city directory by name, postal code, or country.",
    getCitiesSchema.shape, wrap(handleGetCities));

  server.tool("get_regions",
    "Search CDEK region directory by country or region name.",
    getRegionsSchema.shape, wrap(handleGetRegions));

  server.tool("list_delivery_points",
    "Find CDEK pickup points and parcel lockers by city, postal code, or GPS coordinates.",
    listDeliveryPointsSchema.shape, wrap(handleListDeliveryPoints));

  // Barcode (1)
  server.tool("generate_barcode",
    "Generate a barcode/label for a CDEK order by UUID.",
    generateBarcodeSchema.shape, wrap(handleGenerateBarcode));

  // Courier pickup (2)
  server.tool("create_courier_pickup",
    "Schedule a CDEK courier pickup for an order. Specify date and time window.",
    createIntakeSchema.shape, wrap(handleCreateIntake));

  server.tool("get_courier_pickup",
    "Get courier pickup request status by UUID.",
    getIntakeSchema.shape, wrap(handleGetIntake));

  // Print (1)
  server.tool("print_receipt",
    "Generate a receipt/waybill PDF for a CDEK order. Returns a download URL.",
    printReceiptSchema.shape, wrap(handlePrintReceipt));

  // Webhooks (1)
  server.tool("create_webhook",
    "Register a webhook URL to receive CDEK order status updates or delivery photos.",
    createWebhookSchema.shape, wrap(handleCreateWebhook));

  return server;
}
