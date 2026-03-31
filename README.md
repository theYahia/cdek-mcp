# cdek-mcp

MCP-сервер для API СДЭК — расчёт тарифов, создание заказов, отслеживание, справочник городов и ПВЗ.

## Возможности (6 инструментов)

| Инструмент | Описание |
|---|---|
| `calculate_tariff` | Расчёт стоимости и сроков доставки |
| `create_order` | Создание заказа на доставку |
| `get_order` | Информация о заказе по UUID |
| `track` | Отслеживание отправления по номеру |
| `get_cities` | Поиск городов в справочнике СДЭК |
| `list_pvz` | Поиск пунктов выдачи и постаматов |

## Быстрый старт

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

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `CDEK_CLIENT_ID` | Да | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | Да | Client Secret из личного кабинета СДЭК |
| `CDEK_SANDBOX` | Нет | `true` для тестовой среды (api.edu.cdek.ru) |

Получите ключи: [Личный кабинет СДЭК](https://lk.cdek.ru) → Интеграция → Ключи API.

## Авторизация

Сервер использует OAuth2 (client_credentials). TokenManager автоматически получает и обновляет токен.

## Лицензия

MIT
