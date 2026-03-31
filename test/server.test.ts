import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock client to avoid env var requirements
vi.mock("../src/client.js", () => ({
  getClient: () => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { createServer } from "../src/server.js";

describe("MCP Server", () => {
  it("creates server with 8 tools", async () => {
    const server = createServer();
    // The server object has internal tool registry.
    // We can verify by connecting to an in-memory transport and listing tools.
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const { tools } = await client.listTools();
    expect(tools).toHaveLength(8);

    const names = tools.map(t => t.name).sort();
    expect(names).toEqual([
      "calculate_tariff",
      "create_order",
      "delete_order",
      "generate_barcode",
      "get_cities",
      "get_order",
      "list_delivery_points",
      "track_shipment",
    ]);

    await client.close();
  });
});
