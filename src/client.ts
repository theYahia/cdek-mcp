import type { CdekTokenResponse, CdekError } from "./types.js";

const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

class TokenManager {
  private token: string | null = null;
  private expiresAt = 0;
  private refreshPromise: Promise<string> | null = null;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(baseUrl: string, clientId: string, clientSecret: string) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - 60_000) {
      return this.token;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.refresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refresh(): Promise<string> {
    const url = `${this.baseUrl}/oauth/token?parameters`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `СДЭК: ошибка авторизации (HTTP ${response.status}). Проверьте CDEK_CLIENT_ID и CDEK_CLIENT_SECRET. ${text}`
      );
    }

    const data = (await response.json()) as CdekTokenResponse;
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  invalidate(): void {
    this.token = null;
    this.expiresAt = 0;
  }
}

export class CdekClient {
  private tokenManager: TokenManager;
  private baseUrl: string;

  constructor() {
    const clientId = process.env.CDEK_CLIENT_ID ?? "";
    const clientSecret = process.env.CDEK_CLIENT_SECRET ?? "";

    if (!clientId || !clientSecret) {
      throw new Error(
        "Переменные окружения CDEK_CLIENT_ID и CDEK_CLIENT_SECRET обязательны. " +
        "Получите их в личном кабинете СДЭК: Интеграция → Ключи API"
      );
    }

    const sandbox = process.env.CDEK_SANDBOX === "true";
    this.baseUrl = sandbox
      ? "https://api.edu.cdek.ru/v2"
      : "https://api.cdek.ru/v2";

    if (sandbox) {
      console.error("[cdek-mcp] Используется песочница (CDEK_SANDBOX=true)");
    }

    this.tokenManager = new TokenManager(this.baseUrl, clientId, clientSecret);
  }

  async get(path: string, params?: Record<string, string>): Promise<unknown> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request("GET", `${path}${query}`);
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    return this.request("POST", path, body);
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const token = await this.tokenManager.getToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);

        // Token expired — invalidate and retry
        if (response.status === 401 && attempt < MAX_RETRIES) {
          this.tokenManager.invalidate();
          console.error(`[cdek-mcp] Токен истёк, обновляю (${attempt}/${MAX_RETRIES})`);
          continue;
        }

        if (response.ok) {
          return response.json();
        }

        const errorBody = await response.text();

        if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
          console.error(`[cdek-mcp] ${response.status} от ${path}, повтор через ${delay}мс (${attempt}/${MAX_RETRIES})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        let errors: CdekError[] = [];
        try {
          const parsed = JSON.parse(errorBody);
          errors = parsed.errors ?? [];
        } catch {
          // не JSON
        }

        if (errors.length > 0) {
          const msgs = errors.map(e => `[${e.code}] ${e.message}`).join("; ");
          throw new Error(`СДЭК: ${msgs}`);
        }

        throw new Error(`СДЭК HTTP ${response.status}: ${errorBody}`);
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof DOMException && error.name === "AbortError") {
          if (attempt < MAX_RETRIES) {
            console.error(`[cdek-mcp] Таймаут ${path}, повтор (${attempt}/${MAX_RETRIES})`);
            continue;
          }
          throw new Error("СДЭК: таймаут запроса (15 секунд). Попробуйте позже.");
        }
        throw error;
      }
    }

    throw new Error("СДЭК: все попытки исчерпаны");
  }
}
