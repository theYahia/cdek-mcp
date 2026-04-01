# @theyahia/cdek-mcp

MCP server for the CDEK delivery API. 14 tools covering the full delivery lifecycle: tariff calculation, order management, shipment tracking, location search, courier pickup scheduling, document printing, and webhook registration.

## Install

```bash
npm install -g @theyahia/cdek-mcp
```

Or use directly with npx:

```bash
npx @theyahia/cdek-mcp
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CDEK_CLIENT_ID` | Yes | OAuth2 Client ID from CDEK dashboard |
| `CDEK_CLIENT_SECRET` | Yes | OAuth2 Client Secret from CDEK dashboard |
| `CDEK_SANDBOX` | No | Set to `true` to use test environment |

Get your keys: [CDEK Dashboard](https://lk.cdek.ru) -> Integration -> API Keys.

**Sandbox credentials** (for testing):
```
CDEK_CLIENT_ID=EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI
CDEK_CLIENT_SECRET=PjLZkKBHEfAlaQNM6MHXm0jjXVWGq40H
CDEK_SANDBOX=true
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "cdek": {
      "command": "npx",
      "args": ["-y", "@theyahia/cdek-mcp"],
      "env": {
        "CDEK_CLIENT_ID": "your-client-id",
        "CDEK_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Tools (14)

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

### Tracking
| Tool | Description |
|------|-------------|
| `get_tracking` | Track shipment with full status history by CDEK number or UUID |

### Locations
| Tool | Description |
|------|-------------|
| `get_cities` | Search city directory by name, postal code, or country |
| `get_regions` | Search region directory by country or name |
| `list_delivery_points` | Find pickup points and parcel lockers by city or GPS coordinates |

### Courier Pickup
| Tool | Description |
|------|-------------|
| `create_courier_pickup` | Schedule a courier pickup for an order |
| `get_courier_pickup` | Check courier pickup request status |

### Printing
| Tool | Description |
|------|-------------|
| `print_barcode` | Generate barcode PDF for an order |
| `print_receipt` | Generate receipt/waybill PDF for an order |

### Webhooks
| Tool | Description |
|------|-------------|
| `create_webhook` | Register webhook for order status updates or delivery photos |

## Auth

OAuth2 client_credentials flow. The server automatically obtains and refreshes tokens. Retries on 401 (token expired), 429 (rate limit), and 5xx (server errors) with exponential backoff.

## Demo Prompts

1. **"How much does it cost to ship a 2kg parcel from Moscow to Saint Petersburg?"**
   Uses `get_cities` to find city codes, then `calculate_tariff_list` to compare all available tariffs.

2. **"Find the nearest CDEK pickup point to Red Square"**
   Uses `list_delivery_points` with GPS coordinates (latitude: 55.7539, longitude: 37.6208) to find nearby locations.

3. **"Create an order to send a book from Kazan to Novosibirsk, track it, and print the barcode"**
   Uses `create_order`, then `get_tracking` to monitor status, and `print_barcode` to get the shipping label PDF.

## Development

```bash
npm install
npm run dev          # Run with tsx
npm test             # Run tests
npm run build        # Compile TypeScript
```

## License

MIT
