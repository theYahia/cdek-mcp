> ## 🗄 Репозиторий заархивирован
>
> Разработка переехала в **[theYahia/WWmcp](https://github.com/theYahia/WWmcp)** — монорепозиторий MCP-серверов для незападных API: СНГ, MENA, Африка, LATAM, Юго-Восточная Азия. Общее ядро `@theyahia/mcp-core`, единый CI, единый релизный конвейер.
>
> Актуальная версия того, что лежало здесь: [`servers/cdek/`](https://github.com/theYahia/WWmcp/tree/main/servers/cdek)
>
> Пакет в npm прежний — [`@theyahia/cdek-mcp`](https://www.npmjs.com/package/@theyahia/cdek-mcp), ставится и работает как раньше.
> Здесь больше ничего не обновляется. Задачи и pull request'ы — в WWmcp.
>
> **Archived — development moved to [theYahia/WWmcp](https://github.com/theYahia/WWmcp),** a monorepo of MCP servers for non-Western APIs.
> The current version of this package now lives at [`servers/cdek/`](https://github.com/theYahia/WWmcp/tree/main/servers/cdek).
> The npm package [`@theyahia/cdek-mcp`](https://www.npmjs.com/package/@theyahia/cdek-mcp) is unchanged.
> Please open issues and pull requests there.

# MCP-сервер для СДЭК API — 16 инструментов для ИИ-агента: тарифы, заказы, трекинг

Если вы искали, как подключить доставку СДЭК к Claude или другому ИИ-агенту, — этот сервер закрывает весь цикл отправления через CDEK API v2: расчёт тарифов и сроков, создание и отмена заказов, трекинг по накладной, поиск городов и пунктов выдачи, вызов курьера, штрихкоды и квитанции, вебхуки. Спрашиваете «сколько стоит и как долго везти 2 кг из Москвы в Казань» — получаете сравнение тарифов таблицей, а не форму на сайте. Работает и на тестовом контуре СДЭК, и на боевом.

[![npm](https://img.shields.io/npm/v/@theyahia/cdek-mcp)](https://www.npmjs.com/package/@theyahia/cdek-mcp)
[![CI](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/theYahia/cdek-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Демонстрация: вопрос «сколько стоит и как долго везти 2 кг из Москвы в Казань» — агент вызывает calculate_tariff_list и отвечает таблицей тарифов](https://raw.githubusercontent.com/theYahia/WWmcp/main/servers/cdek/assets/demo.svg)

## Инструменты (16)

### Тарифы
| Инструмент | Описание |
|------|-------------|
| `calculate_tariff` | Рассчитать стоимость и срок доставки по конкретному тарифу |
| `calculate_tariff_list` | Все доступные тарифы с ценами по маршруту |

### Заказы
| Инструмент | Описание |
|------|-------------|
| `create_order` | Создать заказ на доставку с отправителем, получателем и местами |
| `get_order` | Детали и статус заказа по UUID |
| `delete_order` | Отменить или удалить заказ по UUID |
| `list_orders` | Поиск и фильтрация заказов по периоду, номеру ИМ или накладной СДЭК |

### Трекинг
| Инструмент | Описание |
|------|-------------|
| `track_shipment` | Отследить отправление по номеру накладной СДЭК |

### География
| Инструмент | Описание |
|------|-------------|
| `get_cities` | Поиск по справочнику городов — по названию, индексу или стране |
| `get_regions` | Поиск по справочнику регионов — по стране или названию |
| `list_delivery_points` | Найти пункты выдачи и постаматы по городу или GPS-координатам |

### Штрихкоды и печать
| Инструмент | Описание |
|------|-------------|
| `generate_barcode` | Сформировать штрихкод или этикетку для заказа |
| `print_receipt` | Сформировать PDF квитанции или накладной по заказу |

### Вызов курьера
| Инструмент | Описание |
|------|-------------|
| `create_courier_pickup` | Заказать забор груза курьером по заказу |
| `get_courier_pickup` | Проверить статус заявки на вызов курьера |

### Вебхуки
| Инструмент | Описание |
|------|-------------|
| `create_webhook` | Зарегистрировать вебхук на смену статуса заказа или фото доставки |
| `delete_webhook` | Удалить подписку на вебхук по UUID |

## Быстрый старт

### Claude Desktop

`~/.config/claude/claude_desktop_config.json` (macOS) или `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

`.cursor/mcp.json` или `.windsurf/mcp.json`:

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

### Транспорт Streamable HTTP

Для веб-развёртываний используйте флаг `--http` или переменную `HTTP_PORT`:

```bash
HTTP_PORT=3000 npx @theyahia/cdek-mcp --http
```

Эндпоинты:
- `POST /mcp` — MCP JSON-RPC
- `GET /mcp` — SSE-поток
- `DELETE /mcp` — завершение сессии
- `GET /health` — проверка состояния

## Переменные окружения

| Переменная | Обяз. | Описание |
|----------|----------|-------------|
| `CDEK_CLIENT_ID` | да | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | да | Client Secret из личного кабинета СДЭК |
| `CDEK_SANDBOX` | нет | `true` — работать в песочнице (api.edu.cdek.ru) |
| `HTTP_PORT` | нет | Порт HTTP-транспорта (включает HTTP-режим) |

Где взять ключи API: [личный кабинет СДЭК](https://lk.cdek.ru) → Интеграция → Ключи API.

## Режим песочницы

Задайте `CDEK_SANDBOX=true`, чтобы работать с тестовым контуром СДЭК (`api.edu.cdek.ru`). Боевой контур — `api.cdek.ru`.

СДЭК публикует общий тестовый аккаунт для интеграционных проверок:
- Client ID: `EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI`
- Client Secret: `PjLZkKBHEiLK3YsjtNrt3TGNG0ahs3kh`

> ⚠️ СДЭК время от времени меняет этот общий тестовый аккаунт. Если вы получили `OAuth token error (HTTP 401) … invalid_client`, публичная пара уже сменилась — запросите собственные ключи песочницы в кабинете интеграции ([lk.cdek.ru](https://lk.cdek.ru) → Интеграция → Ключи API).

## Авторизация

OAuth 2.0, поток Client Credentials, реализован в `OAuthStrategy` из [`@theyahia/mcp-core`](https://www.npmjs.com/package/@theyahia/mcp-core):
- Токен запрашивается автоматически при первом обращении
- Кэширование токена с упреждающим обновлением незадолго до истечения
- Дедупликация параллельных запросов (одно обновление токена делится между всеми)
- Автоматический повтор на 401 со сбросом токена

## E-commerce-стек

Соберите полный ИИ-стек для интернет-магазина вместе с другими серверами WWmcp:

| Сервер | Назначение |
|--------|-------------|
| **cdek-mcp** | Доставка и логистика |
| [dadata-mcp](https://github.com/theYahia/dadata-mcp) | Проверка адресов, поиск компаний |

Часть серии [WWmcp](https://github.com/theYahia/WWmcp).

## Демо-промпты

1. **«Сколько стоит отправить посылку 2 кг из Москвы в Санкт-Петербург?»**
   Использует `get_cities` для поиска кодов городов, затем `calculate_tariff_list` для сравнения всех доступных тарифов.

2. **«Найди ближайший пункт выдачи СДЭК к Красной площади»**
   Использует `get_cities`, чтобы получить `city_code` Москвы, затем `list_delivery_points` с `latitude: 55.7539`, `longitude: 37.6208`, `radius_km: 5` — результаты фильтруются по радиусу и сортируются по расстоянию (у каждого есть поля `координаты` и `расстояние_км`).

3. **«Создай заказ на отправку книги из Казани в Новосибирск, вызови курьера и распечатай квитанцию»**
   Использует `create_order`, затем `create_courier_pickup` для забора груза и `print_receipt` для накладной.

## Разработка

```bash
git clone https://github.com/theYahia/cdek-mcp.git
cd cdek-mcp
npm install

npm run lint        # ESLint (flat config)
npm run typecheck   # tsc --noEmit
npm run build       # сборка в dist/
npm test            # юнит-тесты (vitest)
npm run test:e2e    # e2e smoke-тест (перечисляет инструменты, без реальных ключей)
```

Запуск сервера локально против песочницы СДЭК (`api.edu.cdek.ru`) — с общей тестовой парой из раздела [Режим песочницы](#режим-песочницы) или со своими ключами:

```bash
CDEK_SANDBOX=true \
CDEK_CLIENT_ID=<YOUR_SANDBOX_CLIENT_ID> \
CDEK_CLIENT_SECRET=<YOUR_SANDBOX_CLIENT_SECRET> \
npm run dev
```

Заметки о релизах — в [CHANGELOG.md](./CHANGELOG.md).

## Лицензия

MIT

---

Часть [WWmcp](https://github.com/theYahia/WWmcp) · Telegram: [@vhodvai](https://t.me/vhodvai)
