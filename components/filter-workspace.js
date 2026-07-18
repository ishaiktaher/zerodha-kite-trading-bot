"use client";

import { useEffect, useState } from "react";
import { INDICATORS, OPERATORS, PRESET_SCANS } from "@/lib/screener";

const STORAGE_KEY = "zeta-gain-filters-v1";

function newCondition() {
  return { id: crypto.randomUUID(), indicator: "rsi", operator: "lt", value: 50, period: 14, offset: 0, rightType: "value", rightIndicator: "close", rightPeriod: 14, rightOffset: 0 };
}

function candleCondition(offset, operator) {
  return { ...newCondition(), indicator: "open", period: 14, offset, operator, rightType: "indicator", rightIndicator: "close", rightOffset: offset };
}

function newFilter() {
  return { id: crypto.randomUUID(), name: "Untitled filter", conditions: [newCondition()], updatedAt: new Date().toISOString() };
}

export function FilterWorkspace({ onOpenChart = () => {}, onOrder = () => {} }) {
  const [filters, setFilters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [indicatorSearch, setIndicatorSearch] = useState("");
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    async function load() {
      try {
        if (cached.length && !localStorage.getItem(`${STORAGE_KEY}-imported`)) {
          await fetch("/api/filters/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filters: cached }) });
          localStorage.setItem(`${STORAGE_KEY}-imported`, "true");
        }
        const response = await fetch("/api/filters");
        if (!response.ok) throw new Error();
        const remote = await response.json();
        const initial = remote.length ? remote : [newFilter()];
        setFilters(initial); setSelectedId(initial[0].id);
      } catch { const initial = cached.length ? cached : [newFilter()]; setFilters(initial); setSelectedId(initial[0].id); }
    }
    load();
  }, []);

  useEffect(() => {
    if (filters.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const selected = filters.find((filter) => filter.id === selectedId);

  function updateSelected(updater) {
    setFilters((current) => current.map((filter) => {
      if (filter.id !== selectedId) return filter;
      const next = { ...updater(filter), updatedAt: new Date().toISOString() };
      fetch(`/api/filters/${next.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => {});
      return next;
    }));
    setResults(null);
  }

  function createFilter() {
    const filter = newFilter();
    setFilters((current) => [...current, filter]);
    fetch("/api/filters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(filter) }).catch(() => {});
    setSelectedId(filter.id);
    setResults(null);
  }

  function deleteFilter(id) {
    const remaining = filters.filter((filter) => filter.id !== id);
    setFilters(remaining);
    setSelectedId(remaining[0]?.id || null);
    setResults(null);
    fetch(`/api/filters/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function scan() {
    setScanning(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/filters/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterId: selected.id, conditions: { logic: selected.conditionLogic || "AND", items: selected.conditions }, universe: selected.universe || "NIFTY_50", timeframe: selected.timeframe || "day" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Scan failed");
      setResults(body);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="filter-layout">
      <aside className="filter-sidebar">
        <div className="sidebar-heading"><div><p className="eyebrow">LIBRARY</p><h2>My Filters</h2></div><button className="icon-button" onClick={createFilter} aria-label="Create filter">+</button></div>
        <div className="filter-list">
          {filters.map((filter) => (
            <button key={filter.id} className={`filter-list-item ${selectedId === filter.id ? "selected" : ""}`} onClick={() => { setSelectedId(filter.id); setResults(null); }}>
              <span>{filter.name}</span><small>{filter.conditions.length} condition{filter.conditions.length === 1 ? "" : "s"}</small>
            </button>
          ))}
        </div>
      </aside>

      <div className="filter-main">
        {!selected ? (
          <div className="empty-state"><h2>No filters yet</h2><button className="primary-button" onClick={createFilter}>Create your first filter</button></div>
        ) : (
          <>
            <header className="filter-editor-header">
              <div><p className="eyebrow">FILTER BUILDER</p><input className="filter-name" value={selected.name} onChange={(event) => updateSelected((filter) => ({ ...filter, name: event.target.value }))} aria-label="Filter name" /></div>
              <div className="editor-actions"><button className="danger-button" onClick={() => deleteFilter(selected.id)}>Delete</button><button className="primary-button" onClick={scan} disabled={scanning}>{scanning ? "Scanning NIFTY 50…" : "Generate results"}</button></div>
            </header>

            <div className="indicator-search-wrap">
              <label htmlFor="indicator-search">Search technical indicators</label>
              <input id="indicator-search" placeholder="RSI, moving average, volume…" value={indicatorSearch} onChange={(event) => setIndicatorSearch(event.target.value)} />
              {indicatorSearch && (
                <div className="indicator-menu">
                  {INDICATORS.filter((indicator) => `${indicator.name} ${indicator.category}`.toLowerCase().includes(indicatorSearch.toLowerCase())).map((indicator) => (
                    <button key={indicator.id} onClick={() => { updateSelected((filter) => ({ ...filter, conditions: [...filter.conditions, { ...newCondition(), indicator: indicator.id, period: indicator.defaultPeriod || 14 }] })); setIndicatorSearch(""); }}>
                      <span>{indicator.name}</span><small>{indicator.category}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-settings">
              <label>Universe<select value={selected.universe || "NIFTY_50"} onChange={(event) => updateSelected((filter) => ({ ...filter, universe: event.target.value }))}>{["NIFTY_50", "NIFTY_100", "NIFTY_200", "NIFTY_500", "ALL_NSE_EQUITY"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Timeframe<select value={selected.timeframe || "day"} onChange={(event) => updateSelected((filter) => ({ ...filter, timeframe: event.target.value }))}><option value="day">Daily</option><option value="week">Weekly</option><option value="15minute">15 minute</option><option value="60minute">1 hour</option></select></label>
              <label>Daily schedule<input type="time" value={selected.runDailyAt || ""} onChange={(event) => updateSelected((filter) => ({ ...filter, runDailyAt: event.target.value, isActive: Boolean(event.target.value) }))} /></label>
              <label>Preset<select defaultValue="" onChange={(event) => { const preset = PRESET_SCANS.find((item) => item.id === event.target.value); if (preset) updateSelected((filter) => ({ ...filter, name: preset.name, conditions: preset.conditions.items })); event.target.value = ""; }}><option value="">Choose preset…</option>{PRESET_SCANS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </div>

            <div className="condition-stack">
              <p className="condition-intro">Stock passes <select value={selected.conditionLogic || "AND"} onChange={(event) => updateSelected((filter) => ({ ...filter, conditionLogic: event.target.value }))}><option value="AND">all (AND)</option><option value="OR">any (OR)</option></select> of the following conditions:</p>
              {selected.conditions.map((condition, index) => (
                <ConditionRow key={condition.id} condition={condition} index={index} onChange={(next) => updateSelected((filter) => ({ ...filter, conditions: filter.conditions.map((item) => item.id === condition.id ? next : item) }))} onDelete={() => updateSelected((filter) => ({ ...filter, conditions: filter.conditions.filter((item) => item.id !== condition.id) }))} />
              ))}
              <div className="condition-actions">
                <button className="add-condition" onClick={() => updateSelected((filter) => ({ ...filter, conditions: [...filter.conditions, newCondition()] }))}>+ Add condition</button>
                <button className="add-condition preset-condition" onClick={() => updateSelected((filter) => ({ ...filter, conditions: [...filter.conditions, candleCondition(1, "gt"), candleCondition(2, "gt"), candleCondition(0, "lt")] }))}>+ Add 3-candle pattern</button>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {results && <FilterResults results={results} onOpenChart={onOpenChart} onOrder={onOrder} />}
          </>
        )}
      </div>
    </section>
  );
}

function ConditionRow({ condition, index, onChange, onDelete }) {
  const indicator = INDICATORS.find((item) => item.id === condition.indicator);
  const rightType = condition.rightType || "value";
  const rightIndicator = INDICATORS.find((item) => item.id === condition.rightIndicator);
  return (
    <div className="filter-condition">
      <span className="condition-number">{index + 1}</span>
      <select value={condition.offset} onChange={(event) => onChange({ ...condition, offset: Number(event.target.value) })} aria-label="Candle offset"><option value={0}>Latest</option><option value={1}>1 day ago</option><option value={2}>2 days ago</option></select>
      <select value={condition.indicator} onChange={(event) => { const next = INDICATORS.find((item) => item.id === event.target.value); onChange({ ...condition, indicator: event.target.value, period: next.defaultPeriod || condition.period }); }} aria-label="Indicator">{INDICATORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {indicator?.hasPeriod && <input className="period-input" type="number" min={2} max={200} value={condition.period} onChange={(event) => onChange({ ...condition, period: Number(event.target.value) })} aria-label="Period" />}
      <select value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value })} aria-label="Operator">{OPERATORS.map((operator) => <option key={operator.id} value={operator.id}>{operator.label}</option>)}</select>
      <select className="right-type" value={rightType} onChange={(event) => onChange({ ...condition, rightType: event.target.value, rightOffset: condition.rightOffset ?? condition.offset })} aria-label="Compare with"><option value="value">Value</option><option value="indicator">Indicator</option></select>
      {rightType === "indicator" ? (
        <div className="right-operand">
          <select value={condition.rightOffset ?? condition.offset} onChange={(event) => onChange({ ...condition, rightOffset: Number(event.target.value) })} aria-label="Comparison candle offset"><option value={0}>Latest</option><option value={1}>1 day ago</option><option value={2}>2 days ago</option></select>
          <select value={condition.rightIndicator || "close"} onChange={(event) => { const next = INDICATORS.find((item) => item.id === event.target.value); onChange({ ...condition, rightIndicator: event.target.value, rightPeriod: next.defaultPeriod || condition.rightPeriod || 14 }); }} aria-label="Comparison indicator">{INDICATORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          {rightIndicator?.hasPeriod && <input className="period-input" type="number" min={2} max={200} value={condition.rightPeriod || rightIndicator.defaultPeriod} onChange={(event) => onChange({ ...condition, rightPeriod: Number(event.target.value) })} aria-label="Comparison period" />}
        </div>
      ) : <input className="value-input" type="number" value={condition.value} onChange={(event) => onChange({ ...condition, value: event.target.value })} aria-label="Comparison value" />}
      <button className="remove-condition" onClick={onDelete} aria-label={`Delete condition ${index + 1}`}>×</button>
    </div>
  );
}

function FilterResults({ results, onOpenChart, onOrder }) {
  return (
    <section className="scan-results">
      <div className="results-heading"><div><p className="eyebrow">SCAN COMPLETE</p><h2>{results.matches.length} matches</h2></div><p>{results.scanned} stocks scanned · {results.universe}</p></div>
      {results.matches.length === 0 ? <div className="empty-state">No stocks match every condition right now.</div> : (
        <div className="result-grid">{results.matches.map((match) => <article key={match.symbol}><strong>{match.symbol}</strong><span>₹{match.ltp.toLocaleString("en-IN")} <small className={match.change >= 0 ? "pass-text" : "fail-text"}>{match.change.toFixed(2)}%</small></span><small>{match.details.length}/{match.details.length} conditions passed</small><div className="result-actions"><button onClick={() => onOpenChart(match.symbol)}>Open chart</button><button onClick={() => onOrder(match.symbol)}>Place order</button></div></article>)}</div>
      )}
    </section>
  );
}
