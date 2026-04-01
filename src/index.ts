#!/usr/bin/env node

/**
 * @theyahia/cdek-mcp — MCP server for CDEK delivery API
 *
 * 14 tools: calculate_tariff, calculate_tariff_list, create_order, get_order,
 * delete_order, track_shipment, get_cities, get_regions, list_delivery_points,
 * generate_barcode, create_courier_pickup, get_courier_pickup, print_receipt,
 * create_webhook.
 *
 * Transports:
 *   - stdio (default)  — for Claude Desktop / Cursor / Windsurf
 *   - Streamable HTTP  — --http flag or HTTP_PORT env
 */

import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const useHttp = process.argv.includes("--http") || !!process.env.HTTP_PORT;

async function main() {
  if (useHttp) {
    await startHttpServer();
  } else {
    await startStdioServer();
  }
}

async function startStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cdek-mcp] Сервер запущен (stdio). 14 инструментов.");
}

async function startHttpServer() {
  const { randomUUID } = await import("node:crypto");
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );

  let express: any;
  try {
    express = (await import("express")).default;
  } catch {
    console.error(
      "[cdek-mcp] express is required for HTTP transport. Install it: npm i express",
    );
    process.exit(1);
  }

  const port = parseInt(process.env.HTTP_PORT ?? "3000", 10);
  const app = express();
  app.use(express.json());

  // CORS
  app.use((_req: any, res: any, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
    if (_req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // Health check
  app.get("/health", (_req: any, res: any) => {
    res.json({ status: "ok", server: "cdek-mcp", tools: 14 });
  });

  // Session management
  const transports: Record<string, InstanceType<typeof StreamableHTTPServerTransport>> = {};

  const { isInitializeRequest } = await import("@modelcontextprotocol/sdk/types.js");

  // MCP POST
  app.post("/mcp", async (req: any, res: any) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      if (sessionId && transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid: string) => {
            transports[sid] = transport;
          },
        });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) delete transports[sid];
        };
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID" },
        id: null,
      });
    } catch (error) {
      console.error("[cdek-mcp] HTTP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  // MCP GET (SSE streams)
  app.get("/mcp", async (req: any, res: any) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      return res.status(400).send("Invalid or missing session ID");
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // MCP DELETE (session termination)
  app.delete("/mcp", async (req: any, res: any) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      return res.status(400).send("Invalid or missing session ID");
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.listen(port, () => {
    console.error(`[cdek-mcp] HTTP server listening on port ${port}. 14 tools.`);
  });

  process.on("SIGINT", async () => {
    for (const sid of Object.keys(transports)) {
      await transports[sid].close();
      delete transports[sid];
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[cdek-mcp] Ошибка:", error);
  process.exit(1);
});
