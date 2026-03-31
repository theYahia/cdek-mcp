# cdek-mcp

[![npm](https://img.shields.io/npm/v/@theyahia/cdek-mcp)](https://www.npmjs.com/package/@theyahia/cdek-mcp)
[![CI](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for the CDEK delivery API (v2). Calculate tariffs, create and manage orders, track shipments, find cities and delivery points, generate barcodes.

## Tools (8)

| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `calculate_tariff` | `POST /calculator/tariff` | Calculate shipping cost and delivery time |
| `create_order` | `POST /orders` | Create a delivery order |
| `get_order` | `GET /orders/{uuid}` | Get order details by UUID |
| `track_shipment` | `GET /orders?cdek_number=` | Track shipment by CDEK number |
| `list_delivery_points` | `GET /deliverypoints` | Find pickup points and parcel lockers |
| `get_cities` | `GET /location/cities` | Search cities by name, postal code, or country |
| `generate_barcode` | `POST /orders/{uuid}/barcode` | Generate barcode/label for an order |
| `delete_order` | `DELETE /orders/{uuid}` | Delete an order by UUID |

## Quick Start

### Claude Desktop

`~/.config/claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "cdek": {
      "command": "npx",
      "args": ["-y", "@theyahia/cdek-mcp"],
      "env": {
        "CDEK_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "CDEK_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>",
        "CDEK_SANDBOX": "true"
      }
    }
  }
}
```

### Cursor / Windsurf

`.cursor/mcp.json` or `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "cdek": {
      "command": "npx",
      "args": ["-y", "@theyahia/cdek-mcp"],
      "env": {
        "CDEK_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "CDEK_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>",
        "CDEK_SANDBOX": "true"
      }
    }
  }
}
```

### VS Code (Copilot)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "cdek": {
      "command": "npx",
      "args": ["-y", "@theyahia/cdek-mcp"],
      "env": {
        "CDEK_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "CDEK_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>",
        "CDEK_SANDBOX": "true"
      }
    }
  }
}
```

### Streamable HTTP Transport

For web deployments, use the `--http` flag or `HTTP_PORT` env var:

```bash
HTTP_PORT=3000 npx @theyahia/cdek-mcp --http
```

Endpoints:
- `POST /mcp` — MCP JSON-RPC
- `GET /mcp` — SSE stream
- `DELETE /mcp` — session termination
- `GET /health` — health check

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CDEK_CLIENT_ID` | Yes | Client ID from CDEK dashboard |
| `CDEK_CLIENT_SECRET` | Yes | Client Secret from CDEK dashboard |
| `CDEK_SANDBOX` | No | `true` to use sandbox (api.edu.cdek.ru) |
| `HTTP_PORT` | No | Port for HTTP transport (enables HTTP mode) |

Get your API keys: [CDEK Dashboard](https://lk.cdek.ru) > Integration > API Keys.

## Sandbox Mode

Set `CDEK_SANDBOX=true` to use the CDEK test environment. Sandbox uses test credentials and the `api.edu.cdek.ru` endpoint.

Test credentials for sandbox:
- Client ID: `EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI`
- Client Secret: `PjLZkKBHEiLK3YsjtNrt3TGNG0ahs3kh`

Production uses `api.cdek.ru`.

## Authentication

OAuth 2.0 Client Credentials flow. TokenManager handles:
- Automatic token acquisition on first request
- Token caching (3600s TTL)
- Proactive refresh 60s before expiry
- Concurrent request deduplication
- Automatic retry on 401 with token invalidation

## E-commerce Stack

Pair with other russian-mcp servers for a complete e-commerce AI stack:

| Server | Purpose |
|--------|---------|
| **cdek-mcp** | Shipping & logistics |
| [dadata-mcp](https://github.com/theYahia/dadata-mcp) | Address validation, company lookup |

Part of the [russian-mcp](https://github.com/theYahia?tab=repositories&q=mcp) series.

## Development

```bash
git clone https://github.com/theYahia/cdek-mcp.git
cd cdek-mcp
npm install
npm run build
npm test
```

## License

MIT
