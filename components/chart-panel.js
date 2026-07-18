"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, createSeriesMarkers, HistogramSeries, LineSeries, LineStyle } from "lightweight-charts";
import { calculateMarketStructure } from "@/lib/market-structure";

function movingAverage(candles, period, exponential = false, timeOf = (candle) => String(candle.date || candle.time).slice(0, 10)) {
  let value = 0;
  const multiplier = 2 / (period + 1);
  return candles.map((candle, index) => {
    if (index < period - 1) return null;
    if (index === period - 1) value = candles.slice(0, period).reduce((sum, item) => sum + Number(item.close), 0) / period;
    else value = exponential ? (Number(candle.close) - value) * multiplier + value : candles.slice(index + 1 - period, index + 1).reduce((sum, item) => sum + Number(item.close), 0) / period;
    return { time: timeOf(candle), value };
  }).filter(Boolean);
}

export function ChartPanel({ symbol, onSymbolChange, onOrder }) {
  const host = useRef(null);
  const chartApi = useRef(null);
  const candleApi = useRef(null);
  const [timeframe, setTimeframe] = useState("day");
  const [indicator, setIndicator] = useState("none");
  const [structureLength, setStructureLength] = useState(5);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`, { signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; })
      .then((body) => setCandles(body.candles))
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!host.current || !candles.length) return;
    const timeOf = (item) => ["day", "week"].includes(timeframe)
      ? String(item.date || item.time).slice(0, 10)
      : Math.floor(new Date(item.date || item.time).getTime() / 1000);
    const chart = createChart(host.current, { height: 520, layout: { background: { type: ColorType.Solid, color: "#0d1411" }, textColor: "#9aaba2" }, grid: { vertLines: { color: "#17211c" }, horzLines: { color: "#17211c" } } });
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: "#37d996", downColor: "#ef6b73", borderVisible: false, wickUpColor: "#37d996", wickDownColor: "#ef6b73" });
    const normalized = candles.map((item) => ({ time: timeOf(item), open: Number(item.open), high: Number(item.high), low: Number(item.low), close: Number(item.close) }));
    candleSeries.setData(normalized);
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "volume", color: "#3d8063" });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volume.setData(candles.map((item) => ({ time: timeOf(item), value: Number(item.volume), color: Number(item.close) >= Number(item.open) ? "#275f49" : "#703c42" })));
    if (indicator === "sma20" || indicator === "ema20" || indicator === "ema50") {
      const period = indicator === "ema50" ? 50 : 20;
      const line = chart.addSeries(LineSeries, { color: indicator.startsWith("ema") ? "#f0af4f" : "#5aa7ff", lineWidth: 2 });
      line.setData(movingAverage(candles, period, indicator.startsWith("ema"), timeOf));
    }
    if (indicator === "marketStructure") {
      const structure = calculateMarketStructure(candles, structureLength);
      createSeriesMarkers(candleSeries, structure.events.map((event) => ({
        time: timeOf(candles[event.index]),
        position: event.direction === "bullish" ? "belowBar" : "aboveBar",
        color: event.direction === "bullish" ? "#37d996" : "#ef6b73",
        shape: event.direction === "bullish" ? "arrowUp" : "arrowDown",
        text: event.type.replace("BULLISH_", "").replace("BEARISH_", "").replace("_", " "),
      })));
      structure.structures.forEach((event) => {
        const line = chart.addSeries(LineSeries, { color: event.direction === "bullish" ? "#089981" : "#f23645", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        line.setData([{ time: timeOf(candles[event.swingIndex]), value: event.price }, { time: timeOf(candles[event.index]), value: event.price }]);
      });
      structure.levels.forEach((level) => {
        const line = chart.addSeries(LineSeries, { color: level.type === "support" ? "#089981" : "#f23645", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
        line.setData([{ time: timeOf(candles[level.startIndex]), value: level.price }, { time: timeOf(candles[level.endIndex]), value: level.price }]);
      });
    }
    chart.timeScale().fitContent();
    chartApi.current = chart; candleApi.current = candleSeries;
    const resize = () => chart.applyOptions({ width: host.current?.clientWidth || 800 });
    resize(); window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [candles, indicator, structureLength, timeframe]);

  function addHorizontalLine() {
    const price = Number(candles.at(-1)?.close);
    if (price && candleApi.current) candleApi.current.createPriceLine({ price, color: "#d8b65d", lineWidth: 1, title: "H-Line" });
  }

  return <section className="chart-panel">
    <div className="chart-toolbar">
      <input value={symbol} onChange={(event) => onSymbolChange(event.target.value.toUpperCase())} aria-label="Chart symbol" />
      <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}><option value="day">1D</option><option value="week">1W</option><option value="15minute">15m</option><option value="60minute">1h</option></select>
      <select value={indicator} onChange={(event) => setIndicator(event.target.value)}><option value="none">No overlay</option><option value="sma20">SMA 20</option><option value="ema20">EMA 20</option><option value="ema50">EMA 50</option><option value="marketStructure">Market Structure BOS/CHoCH</option></select>
      {indicator === "marketStructure" && <input type="number" min="3" max="25" value={structureLength} onChange={(event) => setStructureLength(Number(event.target.value))} aria-label="Market structure fractal length" />}
      <button onClick={addHorizontalLine}>Horizontal line</button>
      <button className="primary-button" onClick={() => onOrder(symbol)}>Place order</button>
    </div>
    {loading && <p className="muted">Loading candles…</p>}{error && <div className="error-banner">{error}</div>}
    <div ref={host} className="chart-host" />
    {indicator === "marketStructure" && <p className="fine-print">Market Structure (Fractal) adapted for personal, non-commercial use from LuxAlgo · CC BY-NC-SA 4.0.</p>}
  </section>;
}
