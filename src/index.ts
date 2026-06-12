const SDK_VERSION = "0.1.0";
const DEFAULT_BASE_URL = "https://mansaapi.com";

// ─── Errors ──────────────────────────────────────────────────────────────────

export class MansaAPIError extends Error {
  readonly code: string;
  readonly status: number;
  readonly raw: unknown;

  constructor(code: string, message: string, status: number, raw?: unknown) {
    super(message);
    this.name = "MansaAPIError";
    this.code = code;
    this.status = status;
    this.raw = raw;
  }
}

// ─── Common types ─────────────────────────────────────────────────────────────

export type ApiTier = "standard" | "starter" | "professional" | "institutional";

export interface ApiKeyCreated {
  success: true;
  type: "instant" | "pending";
  api_key?: string;
  tier: ApiTier;
  requests_per_day?: number;
  message: string;
  docs: string;
}

// ─── Markets types ────────────────────────────────────────────────────────────

export interface Exchange {
  code: string;
  name: string;
  country: string;
  city: string;
  timezone: string;
  currency: string;
  market_type: string;
  settlement_cycle: string;
  trading_days: string;
  website: string | null;
  status: "live" | "coming_soon" | "reference";
}

export interface Stock {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  currency: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  market_cap: number | null;
}

export interface Mover extends Stock {
  rank: number;
  direction: "up" | "down";
}

export interface MarketIndex {
  code: string;
  name: string;
  exchange: string;
  current_value: number | null;
  change_pct: number | null;
  updated_at: string | null;
}

export interface ETF {
  symbol: string;
  canonical_symbol: string;
  name: string;
  exchange: string;
  currency: string;
  close: number | null;
  change_percentage: number | null;
}

export interface DividendRecord {
  ex_dividend_date: string;
  record_date: string | null;
  pay_date: string | null;
  dividend_per_share: number | null;
  currency: string;
}

export interface DividendHistory {
  symbol: string;
  count: number;
  latest_ex_dividend_date: string | null;
  history: DividendRecord[];
}

export interface Disclosure {
  id: string;
  symbol: string | null;
  company: string | null;
  type: string | null;
  title: string | null;
  url: string | null;
  created_at: string;
}

export interface InsiderTrade {
  symbol: string;
  company: string | null;
  insider_name: string | null;
  role: string | null;
  transaction_type: "buy" | "sell" | "unknown";
  volume: number | null;
  price: number | null;
  total_value: number | null;
  dealing_date: string | null;
  disclosure_created_at: string | null;
}

export interface InsiderTradesResponse {
  count: number;
  data: InsiderTrade[];
  stats: {
    week_net_flow: number;
    week_total_buys: number;
    week_total_sells: number;
    week_dealings: number;
  };
}

export interface BrokerSignal {
  broker: string;
  action: "BUY" | "HOLD" | "SELL";
  target_price: number | null;
  entry_price: number | null;
  upside: number | null;
}

export interface StockRecommendation {
  ticker: string;
  company_name: string | null;
  sector: string | null;
  last_price: number | null;
  consensus: {
    action: "BUY" | "HOLD" | "SELL";
    buy: number;
    hold: number;
    sell: number;
    avg_target: number | null;
    avg_upside: number | null;
  };
  signals: BrokerSignal[];
}

export interface RecommendationsResponse {
  meta: { week_key: string; week_date: string };
  stocks: StockRecommendation[];
  updated_at: string;
}

// ─── Identity types ───────────────────────────────────────────────────────────

export interface Bank {
  name: string;
  code: string;
  swift_code: string | null;
  type: string;
  country: string;
  mobile_money: boolean;
  ussd: string | null;
}

export interface MobileNetwork {
  name: string;
  code: string;
  country: string;
  prefixes: string[];
  mobile_money: boolean;
  mobile_money_name: string | null;
  ussd: string | null;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  minor_unit: number;
  countries: Array<{ name: string; iso2: string; region: string }>;
}

export interface NubanValidation {
  account: string;
  bank_code: string;
  valid: boolean;
  check_digit_expected: number;
  check_digit_provided: number;
}

// ─── Location types ───────────────────────────────────────────────────────────

export interface Country {
  name: string;
  iso2: string;
  iso3: string;
  capital: string;
  region: string;
  currency: string;
  currency_name: string;
  calling_code: string;
  languages: string[];
  timezone: string;
  stock_exchange: string | null;
}

export interface State {
  code: string;
  name: string;
  country: string;
  admin_level: number;
}

export interface LGA {
  name: string;
  state: string;
  country: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
  observed: boolean;
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

type Params = Record<string, string | number | boolean | undefined | null>;

class HttpClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string
  ) {}

  async get<T>(path: string, params?: Params): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": `mansaapi-node/${SDK_VERSION}`,
      },
    });

    const body = await res.json() as Record<string, unknown>;

    if (!res.ok || body.success === false) {
      const err = body.error as Record<string, unknown> | undefined;
      throw new MansaAPIError(
        String(err?.code ?? "UNKNOWN_ERROR"),
        String(err?.message ?? `Request failed with status ${res.status}`),
        res.status,
        body
      );
    }

    return body as T;
  }

  async post<T>(path: string, payload: unknown): Promise<T> {
    const res = await fetch(new URL(path, this.baseUrl).toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": `mansaapi-node/${SDK_VERSION}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json() as Record<string, unknown>;

    if (!res.ok || body.success === false) {
      const err = body.error as Record<string, unknown> | undefined;
      throw new MansaAPIError(
        String(err?.code ?? "UNKNOWN_ERROR"),
        String(err?.message ?? `Request failed with status ${res.status}`),
        res.status,
        body
      );
    }

    return body as T;
  }
}

// ─── Markets resource ─────────────────────────────────────────────────────────

export class MarketsResource {
  constructor(private http: HttpClient) {}

  /** All tracked African exchanges. */
  async getExchanges(): Promise<{ data: Exchange[] }> {
    return this.http.get("/api/v1/markets/exchanges");
  }

  /** A single exchange by code (e.g. "NGX"). */
  async getExchange(exchangeCode: string): Promise<{ data: Exchange }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}`);
  }

  /** Stocks listed on an exchange. */
  async getStocks(
    exchangeCode: string,
    params?: { limit?: number; offset?: number; sector?: string; sort_by?: string; order?: "asc" | "desc" }
  ): Promise<{ data: Stock[]; pagination: { total: number; limit: number; offset: number } }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/stocks`, params);
  }

  /** A single stock quote. */
  async getStock(exchangeCode: string, ticker: string): Promise<{ data: Stock }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/stocks/${ticker}`);
  }

  /** Top movers (gainers/losers) on an exchange. */
  async getMovers(
    exchangeCode: string,
    params?: { limit?: number; type?: "gainers" | "losers" | "both" }
  ): Promise<{ data: { gainers: Mover[]; losers: Mover[] } }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/movers`, params);
  }

  /** Pan-African top movers across all live exchanges. */
  async getPanAfricanMovers(
    params?: { limit?: number }
  ): Promise<{ data: { gainers: Mover[]; losers: Mover[] } }> {
    return this.http.get("/api/v1/markets/movers/pan-african", params);
  }

  /** Indices for an exchange. */
  async getIndices(exchangeCode: string): Promise<{ data: MarketIndex[] }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/indices`);
  }

  /** A single index by code or slug. */
  async getIndex(exchangeCode: string, code: string): Promise<{ data: MarketIndex }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/indices/${code}`);
  }

  /** ETFs listed on an exchange. */
  async getETFs(exchangeCode: string): Promise<{ data: ETF[] }> {
    return this.http.get(`/api/v1/markets/exchanges/${exchangeCode}/etfs`);
  }

  /** Live forex rates. */
  async getForex(): Promise<{ data: Record<string, unknown>[] }> {
    return this.http.get("/api/v1/markets/forex");
  }

  /** Commodity prices. */
  async getCommodities(): Promise<{ data: Record<string, unknown>[] }> {
    return this.http.get("/api/v1/markets/commodities");
  }

  /** Search stocks by name or ticker. */
  async search(
    query: string,
    params?: { exchange?: string; limit?: number }
  ): Promise<{ data: Stock[] }> {
    return this.http.get("/api/v1/markets/search", { q: query, ...params });
  }

  // ── Premium (Starter+) ────────────────────────────────────────────────────

  /** Dividend history for a stock. Requires Starter tier or higher. */
  async getDividends(
    exchangeCode: string,
    ticker: string,
    params?: { limit?: number }
  ): Promise<DividendHistory> {
    return this.http.get(
      `/api/v1/markets/exchanges/${exchangeCode}/dividends/${ticker}`,
      params
    );
  }

  /** NGX company disclosures and filings. Requires Starter tier or higher. */
  async getDisclosures(
    exchangeCode: string,
    params?: { symbol?: string; type?: string; company?: string; limit?: number }
  ): Promise<{ data: Disclosure[]; count: number }> {
    return this.http.get(
      `/api/v1/markets/exchanges/${exchangeCode}/disclosures`,
      params
    );
  }

  /** Weekly broker recommendations and consensus. Requires Starter tier or higher. */
  async getRecommendations(
    exchangeCode: string,
    params?: { week?: string }
  ): Promise<RecommendationsResponse> {
    return this.http.get(
      `/api/v1/markets/exchanges/${exchangeCode}/recommendations`,
      params
    );
  }

  /** Director dealings (insider trades). Requires Pro tier or higher. */
  async getInsiderTrades(
    exchangeCode: string,
    params?: { symbol?: string; side?: "buy" | "sell"; days?: number; limit?: number }
  ): Promise<InsiderTradesResponse> {
    return this.http.get(
      `/api/v1/markets/exchanges/${exchangeCode}/insider-trades`,
      params
    );
  }
}

// ─── Identity resource ────────────────────────────────────────────────────────

export class IdentityResource {
  constructor(private http: HttpClient) {}

  /** All African banks, optionally filtered by country. */
  async getBanks(params?: { country?: string }): Promise<{ data: Bank[] }> {
    return this.http.get("/api/v1/identity/banks", params);
  }

  /** A single bank by its code (e.g. "058" for GTBank). */
  async getBank(code: string): Promise<{ data: Bank }> {
    return this.http.get(`/api/v1/identity/banks/${code}`);
  }

  /** Mobile networks, optionally filtered by country. */
  async getMobileNetworks(params?: { country?: string }): Promise<{ data: MobileNetwork[] }> {
    return this.http.get("/api/v1/identity/mobile-networks", params);
  }

  /** Identify the mobile network for a phone number. */
  async lookupMobileNetwork(phone: string): Promise<{ data: MobileNetwork }> {
    return this.http.get("/api/v1/identity/mobile-networks/lookup", { phone });
  }

  /** All African currencies with metadata. */
  async getCurrencies(): Promise<{ data: Currency[] }> {
    return this.http.get("/api/v1/identity/currencies");
  }

  /** Validate a Nigerian NUBAN account number checksum. */
  async validateNuban(
    account: string,
    bankCode: string
  ): Promise<{ data: NubanValidation }> {
    return this.http.get("/api/v1/identity/nuban/validate", {
      account,
      bank_code: bankCode,
    });
  }
}

// ─── Location resource ────────────────────────────────────────────────────────

export class LocationResource {
  constructor(private http: HttpClient) {}

  /** All 54 African countries. */
  async getCountries(): Promise<{ data: Country[] }> {
    return this.http.get("/api/v1/location/countries");
  }

  /** A single country by ISO2 or ISO3 code. */
  async getCountry(code: string): Promise<{ data: Country }> {
    return this.http.get(`/api/v1/location/countries/${code}`);
  }

  /** States / provinces / regions for a country. */
  async getStates(countryCode: string): Promise<{ data: State[] }> {
    return this.http.get(`/api/v1/location/countries/${countryCode}/states`);
  }

  /** LGAs / districts for a state. */
  async getLGAs(countryCode: string, stateCode: string): Promise<{ data: LGA[] }> {
    return this.http.get(
      `/api/v1/location/countries/${countryCode}/states/${stateCode}/lgas`
    );
  }

  /** Public holidays for a country and year. */
  async getHolidays(countryCode: string, year: number): Promise<{ data: Holiday[]; meta: { country: string; year: string; total: number } }> {
    return this.http.get(
      `/api/v1/location/countries/${countryCode}/holidays/${year}`
    );
  }
}

// ─── Keys resource ────────────────────────────────────────────────────────────

export class KeysResource {
  constructor(private http: HttpClient) {}

  /** Issue a free standard API key instantly. */
  async create(params: {
    name: string;
    email: string;
    project_description?: string;
  }): Promise<ApiKeyCreated> {
    return this.http.post("/api/v1/keys", { ...params, tier: "standard" });
  }
}

// ─── Main client ──────────────────────────────────────────────────────────────

export interface MansaAPIOptions {
  /** Your Mansa API key (mansa_live_sk_...). Get one free at mansaapi.com */
  apiKey: string;
  /** Override the base URL. Defaults to https://mansaapi.com */
  baseUrl?: string;
}

export class MansaAPI {
  readonly markets: MarketsResource;
  readonly identity: IdentityResource;
  readonly location: LocationResource;
  readonly keys: KeysResource;

  constructor(options: MansaAPIOptions) {
    const http = new HttpClient(
      options.apiKey,
      options.baseUrl ?? DEFAULT_BASE_URL
    );
    this.markets = new MarketsResource(http);
    this.identity = new IdentityResource(http);
    this.location = new LocationResource(http);
    this.keys = new KeysResource(http);
  }
}

export default MansaAPI;
