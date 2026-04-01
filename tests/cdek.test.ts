import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables before any imports that use CdekClient
process.env.CDEK_CLIENT_ID = "test-client-id";
process.env.CDEK_CLIENT_SECRET = "test-client-secret";
process.env.CDEK_SANDBOX = "true";

const TOKEN_RESPONSE = {
  access_token: "test-token-123",
  token_type: "bearer",
  expires_in: 3600,
  scope: "full_access",
  jti: "abc-123",
};

function mockFetchSequence(responses: Array<{ status: number; body: unknown; ok?: boolean }>) {
  let callIndex = 0;
  return vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    // Always return token for oauth requests
    if (urlStr.includes("/oauth/token")) {
      return {
        ok: true,
        status: 200,
        json: async () => TOKEN_RESPONSE,
        text: async () => JSON.stringify(TOKEN_RESPONSE),
      };
    }

    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return {
      ok: resp.ok ?? resp.status === 200,
      status: resp.status,
      json: async () => resp.body,
      text: async () => JSON.stringify(resp.body),
    };
  });
}

describe("CDEK MCP Server", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it("calculate_tariff returns cost and delivery time", async () => {
    globalThis.fetch = mockFetchSequence([
      { status: 200, body: { delivery_sum: 350, period_min: 2, period_max: 4, weight_calc: 1500, currency: "RUB" } },
    ]);

    const { handleCalculateTariff } = await import("../src/tools/calculate.js");
    const result = await handleCalculateTariff({
      from_location: { code: 44 },
      to_location: { code: 137 },
      tariff_code: 136,
      packages: [{ weight: 1500, length: 20, width: 15, height: 10 }],
    });

    const parsed = JSON.parse(result);
    expect(parsed.стоимость_доставки).toBe(350);
    expect(parsed.срок_мин_дней).toBe(2);
    expect(parsed.срок_макс_дней).toBe(4);
    expect(parsed.валюта).toBe("RUB");
  });

  it("calculate_tariff handles API errors gracefully", async () => {
    globalThis.fetch = mockFetchSequence([
      { status: 200, body: { errors: [{ code: "v2_invalid_tariff", message: "Тариф не найден" }] } },
    ]);

    const { handleCalculateTariff } = await import("../src/tools/calculate.js");
    const result = await handleCalculateTariff({
      from_location: { code: 44 },
      to_location: { code: 137 },
      tariff_code: 999,
      packages: [{ weight: 1000 }],
    });

    expect(result).toContain("Ошибка расчёта");
    expect(result).toContain("Тариф не найден");
  });

  it("calculate_tariff_list returns multiple tariffs", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          tariff_codes: [
            { tariff_code: 136, tariff_name: "Посылка склад-склад", delivery_sum: 300, period_min: 2, period_max: 4, delivery_mode: 2 },
            { tariff_code: 137, tariff_name: "Посылка склад-дверь", delivery_sum: 450, period_min: 3, period_max: 5, delivery_mode: 3 },
          ],
        },
      },
    ]);

    const { handleCalculateTariffList } = await import("../src/tools/calculate.js");
    const result = await handleCalculateTariffList({
      from_location: { code: 44 },
      to_location: { code: 137 },
      packages: [{ weight: 1500 }],
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].код_тарифа).toBe(136);
    expect(parsed[1].стоимость).toBe(450);
  });

  it("get_cities returns city list", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: [
          { code: 44, city: "Москва", region: "Московская область", country_code: "RU" },
          { code: 137, city: "Санкт-Петербург", region: "Ленинградская область", country_code: "RU" },
        ],
      },
    ]);

    const { handleGetCities } = await import("../src/tools/locations.js");
    const result = await handleGetCities({ city: "Мос", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].город).toBe("Москва");
  });

  it("get_regions returns region list", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: [
          { region: "Московская область", region_code: 77, country_code: "RU", country: "Россия" },
        ],
      },
    ]);

    const { handleGetRegions } = await import("../src/tools/locations.js");
    const result = await handleGetRegions({ country_codes: "RU", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].регион).toBe("Московская область");
  });

  it("list_delivery_points returns pickup points", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: [
          {
            code: "MSK123",
            name: "ПВЗ Москва-1",
            type: "PVZ",
            location: { city: "Москва", address: "ул. Ленина, 1", latitude: 55.75, longitude: 37.62, country_code: "RU", region_code: 77, city_code: 44 },
            work_time: "09:00-21:00",
            is_dressing_room: true,
            have_cash: true,
            have_cashless: true,
            owner_code: "cdek",
          },
        ],
      },
    ]);

    const { handleListDeliveryPoints } = await import("../src/tools/locations.js");
    const result = await handleListDeliveryPoints({ city_code: 44, type: "ALL", country_code: "RU", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].код).toBe("MSK123");
    expect(parsed[0].координаты.широта).toBe(55.75);
  });

  it("create_order returns uuid and status", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          entity: { uuid: "order-uuid-123", type: 1, is_return: false, is_reverse: false },
          requests: [{ request_uuid: "req-1", type: "CREATE", state: "ACCEPTED" }],
        },
      },
    ]);

    const { handleCreateOrder } = await import("../src/tools/orders.js");
    const result = await handleCreateOrder({
      tariff_code: 136,
      from_location: { code: 44 },
      to_location: { code: 137 },
      recipient: { name: "Иванов Иван", phones: [{ number: "+79001234567" }] },
      packages: [{ number: "1", weight: 1500 }],
    });

    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("order-uuid-123");
    expect(parsed.статус_запроса).toBe("ACCEPTED");
  });

  it("delete_order returns confirmation", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          entity: { uuid: "order-uuid-123", type: 1, is_return: false, is_reverse: false },
          requests: [{ request_uuid: "req-2", type: "DELETE", state: "ACCEPTED" }],
        },
      },
    ]);

    const { handleDeleteOrder } = await import("../src/tools/orders.js");
    const result = await handleDeleteOrder({ uuid: "order-uuid-123" });
    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("order-uuid-123");
    expect(parsed.сообщение).toContain("удалён");
  });

  it("get_tracking returns status history", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          entity: {
            uuid: "uuid-1",
            cdek_number: "1234567890",
            is_return: false,
            is_reverse: false,
            type: 1,
            statuses: [
              { code: "DELIVERED", name: "Вручен", date_time: "2025-01-15T14:30:00+0300", city: "Москва" },
              { code: "ACCEPTED", name: "Принят", date_time: "2025-01-13T10:00:00+0300", city: "Санкт-Петербург" },
            ],
          },
        },
      },
    ]);

    const { handleTrack } = await import("../src/tools/tracking.js");
    const result = await handleTrack({ cdek_number: "1234567890" });
    const parsed = JSON.parse(result);
    expect(parsed.номер).toBe("1234567890");
    expect(parsed.последний_статус.код).toBe("DELIVERED");
    expect(parsed.все_статусы).toHaveLength(2);
  });

  it("get_tracking handles missing shipment", async () => {
    globalThis.fetch = mockFetchSequence([
      { status: 200, body: { entity: null } },
    ]);

    const { handleTrack } = await import("../src/tools/tracking.js");
    const result = await handleTrack({ cdek_number: "0000000000" });
    expect(result).toContain("не найдено");
  });

  it("create_courier_pickup returns intake uuid", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          entity: {
            uuid: "intake-uuid-1",
            order_uuid: "order-uuid-1",
            intake_date: "2025-02-01",
            intake_time_from: "10:00",
            intake_time_to: "14:00",
          },
          requests: [{ request_uuid: "req-3", type: "CREATE", state: "ACCEPTED" }],
        },
      },
    ]);

    const { handleCreateIntake } = await import("../src/tools/intake.js");
    const result = await handleCreateIntake({
      order_uuid: "order-uuid-1",
      intake_date: "2025-02-01",
      intake_time_from: "10:00",
      intake_time_to: "14:00",
    });

    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("intake-uuid-1");
    expect(parsed.дата_забора).toBe("2025-02-01");
  });

  it("create_webhook returns confirmation", async () => {
    globalThis.fetch = mockFetchSequence([
      {
        status: 200,
        body: {
          entity: { uuid: "wh-uuid-1", url: "https://example.com/webhook", type: "ORDER_STATUS" },
          requests: [{ request_uuid: "req-4", type: "CREATE", state: "ACCEPTED" }],
        },
      },
    ]);

    const { handleCreateWebhook } = await import("../src/tools/webhooks.js");
    const result = await handleCreateWebhook({
      url: "https://example.com/webhook",
      type: "ORDER_STATUS",
    });

    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("wh-uuid-1");
    expect(parsed.тип).toBe("ORDER_STATUS");
  });

  it("client retries on 429 rate limit", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/oauth/token")) {
        return { ok: true, status: 200, json: async () => TOKEN_RESPONSE, text: async () => JSON.stringify(TOKEN_RESPONSE) };
      }
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 429, text: async () => "Rate limited", json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ code: 44, city: "Москва", region: "Московская", country_code: "RU" }],
        text: async () => JSON.stringify([{ code: 44, city: "Москва", region: "Московская", country_code: "RU" }]),
      };
    });

    const { handleGetCities } = await import("../src/tools/locations.js");
    const result = await handleGetCities({ city: "Москва", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed[0].город).toBe("Москва");
    expect(callCount).toBe(2);
  });

  it("client retries on 401 and refreshes token", async () => {
    let apiCallCount = 0;
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/oauth/token")) {
        return { ok: true, status: 200, json: async () => TOKEN_RESPONSE, text: async () => JSON.stringify(TOKEN_RESPONSE) };
      }
      apiCallCount++;
      if (apiCallCount === 1) {
        return { ok: false, status: 401, text: async () => "Unauthorized", json: async () => ({}) };
      }
      const body = { entity: { uuid: "uuid-1", cdek_number: "123", is_return: false, is_reverse: false, type: 1, statuses: [] } };
      return {
        ok: true,
        status: 200,
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    });

    const { handleGetOrder } = await import("../src/tools/orders.js");
    const result = await handleGetOrder({ uuid: "uuid-1" });
    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("uuid-1");
    expect(apiCallCount).toBe(2);
  });
});
