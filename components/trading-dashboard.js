"use client";

import { useEffect, useState } from "react";
import { FilterWorkspace } from "@/components/filter-workspace";

const conditionLabels = {
  firstPreviousCandleRed: "Two days ago candle is red",
  previousCandleRed: "Previous day candle is red",
  presentCandleGreen: "Present day candle is green",
  previousCandleRSIBelowThreshold: "Previous day RSI(14) is below 50",
};

async function api(path, options) {
  const response = await fetch(path, { ...options, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function TradingDashboard() {
  const [session, setSession] = useState(null);
  const [symbol, setSymbol] = useState("INFY");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [activeTab, setActiveTab] = useState("trade");
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setLoginError(new URLSearchParams(window.location.search).get("error") || "");
    api("/api/auth/session").then(setSession).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    if (!session?.authenticated || activeTab === "trade" || activeTab === "filters") return;
    const path = activeTab === "funds" ? "/api/account/margins?segment=equity" : `/api/account/${activeTab}`;
    setLoading(true);
    api(path)
      .then(setTabData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [activeTab, session]);

  async function analyze() {
    setLoading(true);
    setError("");
    setSelectedSymbol(symbol);
    try {
      const [nextQuote, nextStrategy] = await Promise.all([
        api(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`),
        api("/api/strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        }),
      ]);
      setQuote(nextQuote);
      setStrategy(nextStrategy);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (session === null) return <main className="center-page"><p>Loading terminal…</p></main>;

  if (!session.authenticated) {
    return (
      <main className="center-page">
        <section className="login-card">
          <div className="brand-mark">ZG</div>
          <p className="eyebrow">PERSONAL TRADING TERMINAL</p>
          <h1>Zeta Gain</h1>
          <p className="muted">Analyze your liquidity-grab strategy using your own Zerodha account.</p>
          {loginError && <p className="error-banner">{loginError}</p>}
          <a className="primary-button" href="/api/auth/login">Connect Zerodha</a>
          <p className="fine-print">Credentials and access tokens remain server-side in an encrypted HTTP-only session.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="terminal-shell">
      <header className="topbar">
        <div><span className="logo">ZG</span><strong>Zeta Gain</strong><span className="status-dot" />LIVE</div>
        <div className="topbar-actions"><span>{session.userId}</span><button onClick={async () => { await api("/api/auth/logout", { method: "POST" }); location.reload(); }}>Sign out</button></div>
      </header>

      <section className="hero">
        <p className="eyebrow">{activeTab === "filters" ? "CUSTOM STOCK SCREENER" : "LIQUIDITY GRAB SCANNER"}</p>
        <h1>{activeTab === "filters" ? "Build the signal you want to find." : "Test the setup, candle by candle."}</h1>
        <p>{activeTab === "filters" ? "Create reusable technical filters and scan the NIFTY 50 universe." : "Two red daily candles, a green present candle, and previous-day RSI below 50."}</p>
      </section>

      <nav className="tabs">
        {["trade", "filters", "orders", "holdings", "positions", "funds"].map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setError(""); }}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {error && <div className="error-banner">{error}</div>}

      {activeTab === "filters" ? <FilterWorkspace /> : activeTab === "trade" ? (
        <>
          <section className="search-panel">
            <label htmlFor="symbol">NSE equity symbol</label>
            <div className="search-row">
              <input id="symbol" value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && analyze()} />
              <button className="primary-button" onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : "Analyze"}</button>
            </div>
          </section>

          {strategy && (
            <section className="dashboard-grid">
              <article className="metric-card">
                <p className="eyebrow">{selectedSymbol}</p>
                <h2>₹{quote?.last_price?.toLocaleString("en-IN")}</h2>
                <p className="muted">Last traded price</p>
                <div className={`signal ${strategy.matched ? "match" : "no-match"}`}>
                  {strategy.matched ? "PATTERN MATCHED" : "NO MATCH"}
                </div>
                <div className="rsi-row"><span>Previous RSI ({strategy.rsiPeriod})</span><strong>{strategy.previousCandleRSI.toFixed(2)}</strong></div>
              </article>

              <article className="conditions-card">
                <p className="eyebrow">CONDITION CHECK</p>
                {Object.entries(strategy.conditions).map(([key, passed]) => (
                  <div className="condition" key={key}>
                    <span className={passed ? "check pass" : "check fail"}>{passed ? "✓" : "×"}</span>
                    <span>{conditionLabels[key]}</span>
                    <strong className={passed ? "pass-text" : "fail-text"}>{passed ? "PASS" : "FAIL"}</strong>
                  </div>
                ))}
                <p className="fine-print">The present-day candle is provisional until the market closes.</p>
              </article>
            </section>
          )}
        </>
      ) : (
        <AccountPanel tab={activeTab} data={tabData} loading={loading} />
      )}
    </main>
  );
}

function AccountPanel({ tab, data, loading }) {
  if (loading) return <section className="empty-state">Loading {tab}…</section>;
  if (tab === "funds") {
    return <section className="account-card"><p className="eyebrow">EQUITY MARGINS</p><h2>₹{data?.available?.cash?.toLocaleString("en-IN") || "0"}</h2><p className="muted">Available cash</p><div className="rsi-row"><span>Utilised debits</span><strong>₹{data?.utilised?.debits?.toLocaleString("en-IN") || "0"}</strong></div></section>;
  }
  const rows = tab === "positions" ? data?.net || [] : Array.isArray(data) ? data : [];
  if (!rows.length) return <section className="empty-state">No {tab} available.</section>;
  return (
    <section className="table-card">
      <div className="table-header"><span>Symbol</span><span>Quantity</span><span>Status / P&amp;L</span></div>
      {rows.map((item, index) => (
        <div className="table-row" key={item.order_id || `${item.tradingsymbol}-${index}`}>
          <strong>{item.tradingsymbol}</strong><span>{item.quantity}</span><span>{item.status || `₹${(item.pnl ?? item.last_price ?? 0).toLocaleString("en-IN")}`}</span>
        </div>
      ))}
    </section>
  );
}
