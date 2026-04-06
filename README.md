# cdek-mcp

[![npm](https://img.shields.io/npm/v/@theyahia/cdek-mcp)](https://www.npmjs.com/package/@theyahia/cdek-mcp)
[![CI](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for the CDEK delivery API (v2). **16 tools** covering the full delivery lifecycle: tariff calculation, order management, shipment tracking, location search, courier pickup, barcode/receipt generation, and webhooks.

## Tools (16)

### Tariffs
| Tool | Description |
|------|-------------|
| `calculate_tariff` | Calculate delivery cost and time for a specific tariff |
| `calculate_tariff_list` | Get all available tariffs with prices for a route |

### Orders
| Tool | Description |
|------|-------------|
| `create_order` | Create a delivery order with sender, recipient, packages |
| `get_order` | Get order details and status by UUID |
| `delete_order` | Cancel/delete an order by UUID |
| `list_orders` | Search/filter orders by date range, IM number, or CDEK waybill |

### Tracking
| Tool | Description |
|------|-------------|
| `track_shipment` | Track shipment by CDEK waybill number |

### Locations
| Tool | Description |
|------|-------------|
| `get_cities` | Search city directory by name, postal code, or country |
| `get_regions` | Search region directory by country or name |
| `list_delivery_points` | Find pickup points and parcel lockers by city or GPS coordinates |

### Barcode & Print
| Tool | Description |
|------|-------------|
| `generate_barcode` | Generate barcode/label for an order |
| `print_receipt` | Generate receipt/waybill PDF for an order |

### Courier Pickup
| Tool | Description |
|------|-------------|
| `create_courier_pickup` | Schedule a courier pickup for an order |
| `get_courier_pickup` | Check courier pickup request status |

### Webhooks
| Tool | Description |
|------|-------------|
| `create_webhook` | Register webhook for order status updates or delivery photos |
| `delete_webhook` | Remove a webhook subscription by UUID |

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

## Demo Prompts

1. **"How much does it cost to ship a 2kg parcel from Moscow to Saint Petersburg?"**
   Uses `get_cities` to find city codes, then `calculate_tariff_list` to compare all available tariffs.

2. **"Find the nearest CDEK pickup point to Red Square"**
   Uses `list_delivery_points` with GPS coordinates (latitude: 55.7539, longitude: 37.6208) to find nearby locations.

3. **"Create an order to send a book from Kazan to Novosibirsk, schedule courier pickup, and print the receipt"**
   Uses `create_order`, then `create_courier_pickup` to schedule collection, and `print_receipt` for the waybill.

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
