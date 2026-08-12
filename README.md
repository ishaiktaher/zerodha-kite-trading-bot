# Zeta Gain

**A Vouchins product**

Zeta Gain is a personal Zerodha-integrated trading terminal that combines Chartink-style technical screening, TradingView-style charts, and Kite account/order management in one Next.js application.

Production: [zerodha-kite-trading-bot.vercel.app](https://zerodha-kite-trading-bot.vercel.app)

> Zeta Gain is currently designed for personal use. A standard Kite Connect application is restricted to the Zerodha client ID associated with that application. Multi-user access requires approval from Zerodha.

## Features

### Technical scanner

- Create, name, edit, and delete reusable filters.
- Combine conditions using `AND` or `OR`.
- Compare indicators with numbers or other indicators.
- Reference the latest, previous, or older candles.
- Scan daily, weekly, 15-minute, and hourly candles.
- Scan NIFTY 50, configured NIFTY 100/200/500 lists, all NSE equities, or custom watchlists.
- Rate-limited historical-data requests with controlled concurrency and exponential backoff.
- Results include the symbol, latest price, percentage change, matched conditions, chart action, and order action.

Supported indicators include:

- Open, High, Low, Close, and Volume
- RSI
- SMA and EMA
- Highest Close and Average Volume
- Bullish/Bearish BOS
- Bullish/Bearish CHoCH
- Support and Resistance Breaks

Supported comparisons include greater than, less than, equal, not equal, crosses above, and crosses below.

### Preset strategies

- Three-candle reversal
- Liquidity-grab setup
- 52-week breakout
- Volume spike
- RSI oversold bounce
- EMA 20/50 golden cross
- Bullish market-structure change

### Liquidity-grab analysis

The built-in setup checks:

1. The two previous daily candles are red (`close < open`).
2. The present daily candle is green (`close > open`).
3. RSI(14), calculated at the previous candle close, is below 50.

The current daily candle remains provisional until the market closes.

### Interactive charts

- Candlestick and volume charts powered by TradingView Lightweight Charts.
- Daily, weekly, 15-minute, and hourly timeframes.
- SMA 20, EMA 20, and EMA 50 overlays.
- Horizontal price-line drawing.
- Market Structure overlay with BOS/CHoCH markers and support/resistance lines.
- Direct navigation from scan results to charts and order entry.

### Zerodha account and orders

- View orders, holdings, positions, funds, and position P&L.
- Place Buy and Sell orders.
- Market, Limit, SL, and SL-M order types.
- MIS, CNC, and NRML products.
- Modify and cancel open orders.
- Review the estimated order value before sending a real order.
- Maintain an independent local audit log while Kite remains the order-book source of truth.

Scan results are never traded automatically. Every order requires explicit user confirmation.

### Persistence and scheduling

The optional Supabase/Postgres layer stores:

- Users
- Filters
- Scan runs
- Watchlists
- Alerts
- Order audit records

Existing browser filters are imported once after login. Local storage remains an offline cache.

A Vercel Hobby-compatible cron endpoint runs once daily at **09:20 IST**. Unattended scans intentionally fail closed until a renewable secondary data provider is configured because short-lived Kite access tokens are not stored in the database.

## Technology

- Next.js App Router
- React
- Kite Connect
- TradingView Lightweight Charts
- Supabase Postgres
- Vercel
- Node.js test runner

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/ishaiktaher/zerodha-kite-trading-bot.git
cd zerodha-kite-trading-bot
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `KITE_API_KEY` | Yes | API key from the Kite developer console |
| `KITE_API_SECRET` | Yes | Secret belonging to the same Kite application |
| `JWT_SECRET` | Yes | Signs the secure application session cookie |
| `DATABASE_URL` | For persistence | Supabase pooled Postgres connection string |
| `CRON_SECRET` | For cron | Protects the scheduled-scan endpoint |
| `NIFTY_100_SYMBOLS` | Optional | Comma-separated index constituents |
| `NIFTY_200_SYMBOLS` | Optional | Comma-separated index constituents |
| `NIFTY_500_SYMBOLS` | Optional | Comma-separated index constituents |
| `ALERT_WEBHOOK_ALLOWLIST` | Optional | Allowed alert destinations |

Generate a strong JWT secret, for example:

```bash
openssl rand -base64 32
```

Do not commit `.env.local` or expose `KITE_API_SECRET`, `JWT_SECRET`, or `DATABASE_URL` to browser code.

### 3. Configure Kite Connect

Set the local redirect URL in the Kite developer console:

```text
http://localhost:3000/api/auth/callback
```

For production, use:

```text
https://YOUR-DOMAIN/api/auth/callback
```

The API key and API secret must come from the same Kite application. Historical scanning and charting require a Kite plan with historical-data permission.

### 4. Configure Supabase

Create a Supabase project and run:

```text
supabase/migrations/202607170001_hybrid_terminal.sql
```

The migration creates a private `zeta_gain` schema. Database access remains server-side; no Supabase service key is sent to the browser.

Use the pooled Postgres connection string for `DATABASE_URL`, especially on Vercel.

### 5. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing and production build

```bash
npm test
npm run build
```

The test suite covers the liquidity-grab strategy, RSI calculations, filter grouping, market-data batching, instrument caching, order auditing, saved-filter evaluation, and Market Structure BOS/CHoCH behavior.

## Deploying to Vercel

1. Import this GitHub repository into Vercel.
2. Add the required environment variables.
3. Set the Kite production callback URL to the deployed `/api/auth/callback` route.
4. Deploy the `main` branch.

The included `vercel.json` configures the once-daily Hobby-compatible cron schedule.

## Important limitations

- Standard Kite Connect apps are personal-use and single-client by default.
- Historical scans and charts require the appropriate Kite market-data permission.
- Real-time tick-by-tick WebSocket chart streaming is not implemented.
- Scheduled scans require a renewable data provider before they can run unattended.
- NIFTY 100/200/500 membership must be supplied through environment variables.
- This project does not automatically execute scan matches.

## Market Structure attribution

The personal-use Market Structure (Fractal) implementation is adapted from LuxAlgo's **Market Structure CHoCH/BOS (Fractal)** and distributed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

It must remain non-commercial unless separate permission is obtained from the original author.

## Disclaimer

This project is an analysis and order-entry tool, not investment advice. Trading involves risk, Verify every signal and order before acting.
