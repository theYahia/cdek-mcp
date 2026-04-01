import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenManager } from "../src/client.js";

describe("TokenManager", () => {
  const BASE_URL = "https://api.edu.cdek.ru/v2";
  const CLIENT_ID = "test-id";
  const CLIENT_SECRET = "test-secret";

  let tm: TokenManager;

  beforeEach(() => {
    tm = new TokenManager(BASE_URL, CLIENT_ID, CLIENT_SECRET);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches a token on first call", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "tok_123",
          token_type: "bearer",
          expires_in: 3600,
          scope: "full_access",
          jti: "abc",
        }),
        { status: 200 },
      ),
    );

    const token = await tm.getToken();
    expect(token).toBe("tok_123");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("caches token on subsequent calls", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "tok_cached",
          token_type: "bearer",
          expires_in: 3600,
          scope: "full_access",
          jti: "abc",
        }),
        { status: 200 },
      ),
    );

    await tm.getToken();
    const second = await tm.getToken();
    expect(second).toBe("tok_cached");
    expect(fetch).toHaveBeenCalledTimes(1); // no second fetch
  });

  it("refreshes when close to expiry (60s window)", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "tok_old",
            token_type: "bearer",
            expires_in: 30, // only 30 seconds — within 60s refresh window
            scope: "full_access",
            jti: "abc",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "tok_new",
            token_type: "bearer",
            expires_in: 3600,
            scope: "full_access",
            jti: "abc",
          }),
          { status: 200 },
        ),
      );

    const first = await tm.getToken();
    expect(first).toBe("tok_old");

    // Second call should refresh since 30s < 60s window
    const second = await tm.getToken();
    expect(second).toBe("tok_new");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws on auth failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(tm.getToken()).rejects.toThrow("ошибка авторизации");
  });

  it("invalidate() forces re-fetch", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "tok_1",
            token_type: "bearer",
            expires_in: 3600,
            scope: "full_access",
            jti: "abc",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "tok_2",
            token_type: "bearer",
            expires_in: 3600,
            scope: "full_access",
            jti: "abc",
          }),
          { status: 200 },
        ),
      );

    const first = await tm.getToken();
    expect(first).toBe("tok_1");

    tm.invalidate();

    const second = await tm.getToken();
    expect(second).toBe("tok_2");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent refresh calls", async () => {
    let resolveToken: (v: Response) => void;
    const pending = new Promise<Response>((r) => { resolveToken = r; });
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(pending as any);

    const p1 = tm.getToken();
    const p2 = tm.getToken();

    resolveToken!(
      new Response(
        JSON.stringify({
          access_token: "tok_dedup",
          token_type: "bearer",
          expires_in: 3600,
          scope: "full_access",
          jti: "abc",
        }),
        { status: 200 },
      ),
    );

    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBe("tok_dedup");
    expect(t2).toBe("tok_dedup");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
