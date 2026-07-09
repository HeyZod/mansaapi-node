# mansaapi

Official Node.js SDK for [Mansa API](https://mansaapi.com) — African market data, bank codes, location, and financial identity in one clean REST layer.

**New (July 2026): the pan-African licensed-bank registry.** 293 institutions across
22 countries — including every credit institution licensed by the BCEAO (8 WAEMU
countries, official register) and all COBAC-supervised banks (6 CEMAC countries,
national registers) with verified SWIFT/BIC codes. Registry countries require a
[paid-tier key](https://mansaapi.com/pricing); the 8 core countries stay on the free tier.

```ts
// Every licensed bank in Senegal — BCEAO licence numbers + verified SWIFT codes
const banks = await mansa.identity.getBanks({ country: "SN" }); // starter tier+
```

[![npm version](https://img.shields.io/npm/v/mansaapi.svg)](https://www.npmjs.com/package/mansaapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Install

```bash
npm install mansaapi
# or
yarn add mansaapi
# or
pnpm add mansaapi
```

## Quick start

```ts
import { MansaAPI } from "mansaapi";

const mansa = new MansaAPI({ apiKey: "mansa_live_sk_..." });

// Pan-African market movers
const movers = await mansa.markets.getPanAfricanMovers({ limit: 10 });

// GTBank by code
const bank = await mansa.identity.getBank("058");
console.log(bank.data.name);       // "Guaranty Trust Bank (GTBank)"
console.log(bank.data.swift_code); // "GTBINGLA"

// Nigerian public holidays 2026
const holidays = await mansa.location.getHolidays("NG", 2026);
```

Get a free API key at [mansaapi.com](https://mansaapi.com) — 100 requests/day, no credit card.

---

## Markets

```ts
// Exchanges
const exchanges = await mansa.markets.getExchanges();

// Stocks on NGX with sector filter
const stocks = await mansa.markets.getStocks("NGX", { sector: "Banking", limit: 20 });

// Single stock quote
const gtco = await mansa.markets.getStock("NGX", "GTCO");

// Top movers on NGX
const movers = await mansa.markets.getMovers("NGX", { type: "gainers" });

// Pan-African movers (all live exchanges)
const panAfrica = await mansa.markets.getPanAfricanMovers();

// NGX index universe
const indices = await mansa.markets.getIndices("NGX");
const asi = await mansa.markets.getIndex("NGX", "ASI");

// ETFs
const etfs = await mansa.markets.getETFs("NGX");

// Search
const results = await mansa.markets.search("Zenith", { exchange: "NGX" });

// Forex + commodities
const forex = await mansa.markets.getForex();
const commodities = await mansa.markets.getCommodities();
```

### Premium endpoints

Starter tier or higher required for dividends, disclosures, and recommendations.
Pro tier required for insider trades. See [mansaapi.com/pricing](https://mansaapi.com/pricing).

```ts
// Dividend history (Starter+)
const dividends = await mansa.markets.getDividends("NGX", "GTCO");

// NGX filings and announcements (Starter+)
const disclosures = await mansa.markets.getDisclosures("NGX", { symbol: "GTCO" });

// Weekly broker recommendations (Starter+)
const recs = await mansa.markets.getRecommendations("NGX");
console.log(recs.stocks[0].consensus); // { action: "BUY", buy: 3, hold: 1, sell: 0 }

// Director dealings / insider trades (Pro+)
const insider = await mansa.markets.getInsiderTrades("NGX", { days: 30 });
console.log(insider.stats.week_net_flow);
```

---

## Identity

```ts
// All African banks
const banks = await mansa.identity.getBanks();

// Filter by country
const nigeriaBanks = await mansa.identity.getBanks({ country: "NG" });

// Single bank by code
const zenith = await mansa.identity.getBank("057");

// Mobile network lookup
const network = await mansa.identity.lookupMobileNetwork("08031234567");
console.log(network.data.name); // "MTN Nigeria"

// All networks for a country
const networks = await mansa.identity.getMobileNetworks({ country: "GH" });

// African currencies
const currencies = await mansa.identity.getCurrencies();

// NUBAN checksum validation
const result = await mansa.identity.validateNuban("0123456789", "058");
console.log(result.data.valid); // true or false
```

---

## Location

```ts
// All 54 African countries
const countries = await mansa.location.getCountries();

// Single country
const nigeria = await mansa.location.getCountry("NG");

// States / provinces
const states = await mansa.location.getStates("NG");

// LGAs for a state
const lgas = await mansa.location.getLGAs("NG", "LA"); // Lagos LGAs

// Public holidays
const holidays = await mansa.location.getHolidays("NG", 2026);
```

---

## Error handling

```ts
import { MansaAPI, MansaAPIError } from "mansaapi";

const mansa = new MansaAPI({ apiKey: "mansa_live_sk_..." });

try {
  const data = await mansa.markets.getInsiderTrades("NGX");
} catch (err) {
  if (err instanceof MansaAPIError) {
    console.log(err.code);    // "TIER_REQUIRED"
    console.log(err.status);  // 403
    console.log(err.message); // "This endpoint requires a professional tier key..."
  }
}
```

### Error codes

| Code | Status | Meaning |
|---|---|---|
| `INVALID_API_KEY` | 401 | Key not found or revoked |
| `RATE_LIMIT_EXCEEDED` | 429 | Daily request limit reached |
| `TIER_REQUIRED` | 403 | Endpoint requires a higher tier |
| `NOT_FOUND` | 404 | Resource not found |
| `UPSTREAM_ERROR` | 502 | Upstream data source unreachable |

---

## TypeScript

The SDK ships with full TypeScript types for every request and response.

```ts
import type { Bank, Stock, Holiday, MansaAPIOptions } from "mansaapi";
```

---

## Supported exchanges

| Code | Exchange | Country |
|---|---|---|
| NGX | Nigerian Exchange Group | Nigeria |
| GSE | Ghana Stock Exchange | Ghana |
| NSE | Nairobi Securities Exchange | Kenya |
| JSE | Johannesburg Stock Exchange | South Africa |
| BRVM | Bourse Régionale des Valeurs Mobilières | West Africa |
| DSE | Dar es Salaam Stock Exchange | Tanzania |
| LUSE | Lusaka Securities Exchange | Zambia |

---

## Links

- [Documentation](https://mansaapi.com/docs)
- [Pricing](https://mansaapi.com/pricing)
- [OpenAPI spec](https://mansaapi.com/openapi.json)
- [Status](https://mansaapi.com/health)
- [api@mansamarkets.com](mailto:api@mansamarkets.com)
