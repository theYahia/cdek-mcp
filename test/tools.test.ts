import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the client before importing tools
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock("../src/client.js", () => ({
  getClient: () => ({
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  }),
}));

import { handleCalculateTariff } from "../src/tools/calculate.js";
import { handleGetCities, handleListDeliveryPoints } from "../src/tools/locations.js";
import { handleCreateOrder, handleGetOrder, handleDeleteOrder } from "../src/tools/orders.js";
import { handleTrackShipment } from "../src/tools/tracking.js";
import { handleGenerateBarcode } from "../src/tools/barcode.js";

describe("calculate_tariff", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns formatted tariff result", async () => {
    mockPost.mockResolvedValueOnce({
      delivery_sum: 450,
      period_min: 2,
      period_max: 4,
      weight_calc: 1500,
      currency: "RUB",
    });

    const result = await handleCalculateTariff({
      from_location: { code: 44 },
      to_location: { code: 137 },
      tariff_code: 136,
      packages: [{ weight: 1500 }],
    });

    const parsed = JSON.parse(result);
    expect(parsed.стоимость_доставки).toBe(450);
    expect(parsed.срок_мин_дней).toBe(2);
    expect(mockPost).toHaveBeenCalledWith("/calculator/tariff", expect.any(Object));
  });

  it("returns error when API responds with errors", async () => {
    mockPost.mockResolvedValueOnce({
      errors: [{ code: "v2_invalid_tariff", message: "Тариф не найден" }],
    });

    const result = await handleCalculateTariff({
      from_location: { code: 44 },
      to_location: { code: 137 },
      tariff_code: 999,
      packages: [{ weight: 1000 }],
    });

    expect(result).toContain("Ошибка расчёта");
    expect(result).toContain("v2_invalid_tariff");
  });
});

describe("create_order", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns order UUID on success", async () => {
    mockPost.mockResolvedValueOnce({
      entity: { uuid: "order-uuid-123", cdek_number: "1234567890" },
      requests: [{ request_uuid: "req-1", type: "CREATE", state: "ACCEPTED" }],
    });

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
});

describe("get_order", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns order info", async () => {
    mockGet.mockResolvedValueOnce({
      entity: {
        uuid: "order-uuid-123",
        cdek_number: "1234567890",
        statuses: [
          { code: "CREATED", name: "Создан", date_time: "2025-01-01T00:00:00Z", city: "Москва" },
        ],
      },
    });

    const result = await handleGetOrder({ uuid: "order-uuid-123" });
    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("order-uuid-123");
    expect(parsed.статусы).toHaveLength(1);
  });
});

describe("track_shipment", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns tracking info", async () => {
    mockGet.mockResolvedValueOnce({
      entity: {
        uuid: "uuid-1",
        cdek_number: "1234567890",
        statuses: [
          { code: "DELIVERED", name: "Вручен", date_time: "2025-01-05T12:00:00Z", city: "СПб" },
          { code: "CREATED", name: "Создан", date_time: "2025-01-01T00:00:00Z", city: "Москва" },
        ],
      },
    });

    const result = await handleTrackShipment({ cdek_number: "1234567890" });
    const parsed = JSON.parse(result);
    expect(parsed.номер).toBe("1234567890");
    expect(parsed.последний_статус.код).toBe("DELIVERED");
    expect(parsed.все_статусы).toHaveLength(2);
  });

  it("handles not found", async () => {
    mockGet.mockResolvedValueOnce({ entity: null });

    const result = await handleTrackShipment({ cdek_number: "0000000000" });
    expect(result).toContain("не найдено");
  });
});

describe("get_cities", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns city list", async () => {
    mockGet.mockResolvedValueOnce([
      { code: 44, city: "Москва", region: "Московская", country_code: "RU" },
    ]);

    const result = await handleGetCities({ city: "Москва", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].город).toBe("Москва");
  });

  it("handles empty results", async () => {
    mockGet.mockResolvedValueOnce([]);
    const result = await handleGetCities({ city: "НесуществующийГород", size: 50, page: 0 });
    expect(result).toContain("не найдены");
  });
});

describe("list_delivery_points", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns delivery points", async () => {
    mockGet.mockResolvedValueOnce([
      {
        code: "MSK-001",
        name: "ПВЗ Москва-1",
        type: "PVZ",
        location: { city: "Москва", address: "ул. Тверская, 1", country_code: "RU", region_code: 77, city_code: 44, longitude: 37.6, latitude: 55.7 },
        owner_code: "cdek",
        work_time: "09:00-21:00",
        is_dressing_room: true,
        have_cash: true,
        have_cashless: true,
      },
    ]);

    const result = await handleListDeliveryPoints({ city_code: 44, type: "ALL", country_code: "RU", size: 50, page: 0 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].код).toBe("MSK-001");
  });
});

describe("generate_barcode", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns barcode request status", async () => {
    mockPost.mockResolvedValueOnce({
      entity: { uuid: "order-uuid-123" },
      requests: [{ request_uuid: "req-bar", type: "CREATE", state: "ACCEPTED" }],
    });

    const result = await handleGenerateBarcode({ uuid: "order-uuid-123", copy_count: 1, format: "A4" });
    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("order-uuid-123");
    expect(parsed.статус_запроса).toBe("ACCEPTED");
    expect(mockPost).toHaveBeenCalledWith("/orders/order-uuid-123/barcode", { copy_count: 1, format: "A4" });
  });
});

describe("delete_order", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns deletion confirmation", async () => {
    mockDelete.mockResolvedValueOnce({
      entity: { uuid: "order-uuid-123" },
      requests: [{ request_uuid: "req-del", type: "DELETE", state: "ACCEPTED" }],
    });

    const result = await handleDeleteOrder({ uuid: "order-uuid-123" });
    const parsed = JSON.parse(result);
    expect(parsed.uuid).toBe("order-uuid-123");
    expect(parsed.сообщение).toBe("Заказ удалён.");
    expect(mockDelete).toHaveBeenCalledWith("/orders/order-uuid-123");
  });
});
