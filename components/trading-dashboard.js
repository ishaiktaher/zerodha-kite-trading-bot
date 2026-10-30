"use client";

import { useEffect, useState } from "react";
import { FilterWorkspace } from "@/components/filter-workspace";
import { ChartPanel } from "@/components/chart-panel";
import { OrderModal } from "@/components/order-modal";

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
  const [strategyMode, setStrategyMode] = useState("breakout-fvg");
  const [symbol, setSymbol] = useState("INFY");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [activeTab, setActiveTab] = useState("trade");
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orderDraft, setOrderDraft] = useState(null);

  useEffect(() => {
    setLoginError(new URLSearchParams(window.location.search).get("error") || "");
    api("/api/auth/session").then(setSession).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    if (!session?.authenticated || ["trade", "filters", "chart"].includes(activeTab)) return;
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
      const endpoint = strategyMode === "breakout-fvg" ? "/api/strategy/breakout-fvg" : "/api/strategy";
      const [nextQuote, nextStrategy] = await Promise.all([
        api(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`),
        api(endpoint, {
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

  function openChart(nextSymbol) { setSymbol(nextSymbol); setActiveTab("chart"); }

  if (session === null) return <main className="center-page"><p>Loading terminal…</p></main>;

  if (!session.authenticated) {
    return (
      <main className="center-page">
        <section className="login-card">
          <div className="brand-mark">ZG</div>
          <p className="eyebrow">PERSONAL TRADING TERMINAL</p>
          <h1>Zeta Gain</h1>
          <p className="product-credit">A Vouchins product</p>
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
        <div><span className="logo">ZG</span><span className="brand-title"><strong>Zeta Gain</strong><small>A Vouchins product</small></span><span className="status-dot" />LIVE</div>
        <div className="topbar-actions"><span>{session.userId}</span><button onClick={async () => { await api("/api/auth/logout", { method: "POST" }); location.reload(); }}>Sign out</button></div>
      </header>

      <section className="hero">
        <p className="eyebrow">{activeTab === "filters" ? "CUSTOM STOCK SCREENER" : activeTab === "chart" ? "INTERACTIVE CHARTS" : strategyMode === "breakout-fvg" ? "15M SWEEP + 5M FAIR VALUE GAP" : "LIQUIDITY GRAB SCANNER"}</p>
        <h1>{activeTab === "filters" ? "Build the signal you want to find." : activeTab === "chart" ? "Analyze price action across timeframes." : strategyMode === "breakout-fvg" ? "Multi-timeframe liquidity sweep & FVG." : "Test the setup, candle by candle."}</h1>
        <p>{activeTab === "filters" ? "Create reusable technical filters and scan the NIFTY 50 universe." : activeTab === "chart" ? "Candlesticks, volume, market structure BOS/CHoCH, and Fair Value Gaps." : strategyMode === "breakout-fvg" ? "15-minute 14-candle high sweep (High > H14, Close < H14) with 5-minute cut candle Fair Value Gap." : "Two red daily candles, a green present candle, and previous-day RSI below 50."}</p>
      </section>

      <nav className="tabs">
        {["trade", "filters", "chart", "orders", "holdings", "positions", "funds"].map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setError(""); }}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {error && <div className="error-banner">{error}</div>}

      {activeTab === "filters" ? <FilterWorkspace onOpenChart={openChart} onOrder={setOrderDraft} /> : activeTab === "chart" ? <ChartPanel symbol={symbol} onSymbolChange={setSymbol} onOrder={setOrderDraft} /> : activeTab === "trade" ? (
        <>
          <section className="search-panel">
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <button
                type="button"
                className={strategyMode === "breakout-fvg" ? "primary-button" : ""}
                style={strategyMode === "breakout-fvg" ? { padding: "8px 16px", height: "36px", fontSize: "12px" } : { padding: "8px 16px", height: "36px", fontSize: "12px", background: "#15231c", border: "1px solid #2a3932", color: "var(--muted)", borderRadius: "8px" }}
                onClick={() => { setStrategyMode("breakout-fvg"); setStrategy(null); }}
              >
                15m Sweep + 5m FVG
              </button>
              <button
                type="button"
                className={strategyMode === "liquidity-grab" ? "primary-button" : ""}
                style={strategyMode === "liquidity-grab" ? { padding: "8px 16px", height: "36px", fontSize: "12px" } : { padding: "8px 16px", height: "36px", fontSize: "12px", background: "#15231c", border: "1px solid #2a3932", color: "var(--muted)", borderRadius: "8px" }}
                onClick={() => { setStrategyMode("liquidity-grab"); setStrategy(null); }}
              >
                Liquidity Grab (Daily)
              </button>
            </div>
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
                <div className="editor-actions">
                  <button onClick={() => openChart(selectedSymbol)}>Open chart</button>
                  <button onClick={() => setOrderDraft(selectedSymbol)}>Place order</button>
                </div>
                {strategyMode === "breakout-fvg" ? (
                  <>
                    <div className="rsi-row">
                      <span>15m H14 High</span>
                      <strong>₹{strategy.htf?.h14 ?? "—"}</strong>
                    </div>
                    <div className="rsi-row">
                      <span>5m Cut Candle High</span>
                      <strong>₹{strategy.ltf?.high ?? "—"}</strong>
                    </div>
                    {strategy.fvg?.exists && (
                      <div className="rsi-row">
                        <span>5m {strategy.fvg.type?.toUpperCase()} FVG</span>
                        <strong style={{ color: "var(--green)" }}>₹{strategy.fvg.bottom} – ₹{strategy.fvg.top} (₹{strategy.fvg.gapSize})</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rsi-row">
                    <span>Previous RSI ({strategy.rsiPeriod})</span>
                    <strong>{strategy.previousCandleRSI?.toFixed(2)}</strong>
                  </div>
                )}
              </article>

              <article className="conditions-card">
                <p className="eyebrow">CONDITION CHECK ({strategyMode === "breakout-fvg" ? "15M SWEEP + 5M FVG" : "LIQUIDITY GRAB"})</p>
                {strategyMode === "breakout-fvg" ? (
                  <>
                    <div className="condition">
                      <span className={strategy.htf?.brokenHigh ? "check pass" : "check fail"}>
                        {strategy.htf?.brokenHigh ? "✓" : "×"}
                      </span>
                      <span>15m Candle swept 14-period High (High ₹{strategy.htf?.high} &gt; H14 ₹{strategy.htf?.h14})</span>
                      <strong className={strategy.htf?.brokenHigh ? "pass-text" : "fail-text"}>
                        {strategy.htf?.brokenHigh ? "PASS" : "FAIL"}
                      </strong>
                    </div>

                    <div className="condition">
                      <span className={strategy.htf?.closedBelow ? "check pass" : "check fail"}>
                        {strategy.htf?.closedBelow ? "✓" : "×"}
                      </span>
                      <span>15m Candle closed back below H14 (Close ₹{strategy.htf?.close} &lt; H14 ₹{strategy.htf?.h14})</span>
                      <strong className={strategy.htf?.closedBelow ? "pass-text" : "fail-text"}>
                        {strategy.htf?.closedBelow ? "PASS" : "FAIL"}
                      </strong>
                    </div>

                    <div className="condition">
                      <span className={Boolean(strategy.ltf) ? "check pass" : "check fail"}>
                        {Boolean(strategy.ltf) ? "✓" : "×"}
                      </span>
                      <span>5m Cut Candle identified in 15m window {strategy.ltf ? `(${new Date(strategy.ltf.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}</span>
                      <strong className={Boolean(strategy.ltf) ? "pass-text" : "fail-text"}>
                        {Boolean(strategy.ltf) ? "PASS" : "FAIL"}
                      </strong>
                    </div>

                    <div className="condition">
                      <span className={strategy.fvg?.exists ? "check pass" : "check fail"}>
                        {strategy.fvg?.exists ? "✓" : "×"}
                      </span>
                      <span>
                        Fair Value Gap exists with Cut Candle as 3rd Candle
                        {strategy.fvg?.exists ? ` (${strategy.fvg.type.toUpperCase()}: ₹${strategy.fvg.bottom} – ₹${strategy.fvg.top})` : ""}
                      </span>
                      <strong className={strategy.fvg?.exists ? "pass-text" : "fail-text"}>
                        {strategy.fvg?.exists ? "PASS" : "FAIL"}
                      </strong>
                    </div>

                    <p className="fine-print">
                      {strategy.message || "Multi-timeframe confirmation: 15m candle swept the high of last 14 candles, cut candle identified on 5m, and 3-candle FVG verified."}
                    </p>
                  </>
                ) : (
                  <>
                    {strategy.conditions && Object.entries(strategy.conditions).map(([key, passed]) => (
                      <div className="condition" key={key}>
                        <span className={passed ? "check pass" : "check fail"}>{passed ? "✓" : "×"}</span>
                        <span>{conditionLabels[key]}</span>
                        <strong className={passed ? "pass-text" : "fail-text"}>{passed ? "PASS" : "FAIL"}</strong>
                      </div>
                    ))}
                    <p className="fine-print">The present-day candle is provisional until the market closes.</p>
                  </>
                )}
              </article>
            </section>
          )}
        </>
      ) : (
        <AccountPanel tab={activeTab} data={tabData} loading={loading} onModify={setOrderDraft} onRefresh={() => setActiveTab("trade")} />
      )}
      <OrderModal order={orderDraft} onClose={() => setOrderDraft(null)} />
    </main>
  );
}

function AccountPanel({ tab, data, loading, onModify, onRefresh }) {
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
          <strong>{item.tradingsymbol}</strong><span>{item.quantity}</span><span>{item.status || `₹${(item.pnl ?? item.last_price ?? 0).toLocaleString("en-IN")}`}{tab === "orders" && ["OPEN", "TRIGGER PENDING"].includes(item.status) && <span className="inline-actions"><button onClick={() => onModify({ symbol: item.tradingsymbol, orderId: item.order_id })}>Modify</button><button onClick={async () => { if (!confirm(`Cancel order ${item.order_id}?`)) return; await api("/api/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: item.order_id, symbol: item.tradingsymbol, side: item.transaction_type, quantity: item.quantity, orderType: item.order_type, product: item.product, price: item.price }) }); onRefresh(); }}>Cancel</button></span>}</span>
        </div>
      ))}
    </section>
  );
}
