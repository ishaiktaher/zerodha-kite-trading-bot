# Zeta Gain — Zerodha Personal Trading Terminal

This repository is now a single Next.js full-stack application. The interface and authenticated Kite Connect API routes are served from one origin locally and on Vercel.

## Current functionality

- Zerodha Kite Connect login and logout with a signed, HTTP-only session cookie.
- Live NSE quote lookup for a user-entered equity symbol.
- Liquidity-grab analysis using three daily candles and previous-day RSI(14).
- Account views for orders, holdings, positions, and available equity funds.
- A reusable filter builder with create, rename, edit, and delete operations. Filters are saved in the browser.
- Technical conditions using Open, High, Low, Close, Volume, RSI, SMA, and EMA.
- Latest, one-day-ago, and two-days-ago candle references on either side of a comparison.
- Numeric and indicator-to-indicator comparisons using greater than, less than, equal, not equal, crosses above, and crosses below operators.
- A one-click three-candle preset for previous Open > Close conditions and latest Open < Close.
- NIFTY 50 scanning with matching symbols and their latest closing prices.

Historical-data analysis and NIFTY 50 scans require a Kite Connect subscription that permits historical candle requests. The application currently detects setups and displays account information; it does not automatically place trades.

## Liquidity-grab strategy

The strategy endpoint evaluates the latest three daily candles for a selected NSE equity:

1. The two previous candles must be red (`close < open`).
2. The present-day candle must be green (`close > open`).
3. RSI(14), calculated at the previous day's close, must be below 50.

The present-day candle changes while the market is open, so an intraday match is provisional until the daily candle closes. This implementation detects and displays the setup; it does not automatically place an order.

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-repo/algo-trading-bot.git
   cd algo-trading-bot
   ```

2. Install and configure the application

   ```bash
   npm install
   cp .env.example .env.local
   # Add KITE_API_KEY, KITE_API_SECRET, and JWT_SECRET
   npm run dev
   ```

3. Configure the Kite Connect redirect URL

   ```bash
   http://localhost:3000/api/auth/callback
   ```

For Vercel, set the same three secrets as project environment variables and configure the production callback as `https://YOUR-DOMAIN/api/auth/callback` in the Kite developer console.
## Screenshots

   1. **Dashboard**
   ![ALT TEXT](./client/public/images/dashboard.png)

   2. **Funds**
   ![ALT TEXT](./client/public/images/funds-overview.png)

   3. **Login**
   ![ALT TEXT](./client/public/images/login.png)

   4. **Orders**
   ![ALT TEXT](./client/public/images/orders.png)

   4. **Portfolio**
   ![ALT TEXT](./client/public/images/portfolio.png)
