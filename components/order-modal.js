"use client";
import { useEffect, useState } from "react";

export function OrderModal({ order, onClose }) {
  const symbol = typeof order === "string" ? order : order?.symbol;
  const [form, setForm] = useState({ side: "BUY", product: "MIS", orderType: "MARKET", quantity: 1, price: "", triggerPrice: "", validity: "DAY" });
  const [ltp, setLtp] = useState(0); const [confirming, setConfirming] = useState(false); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { if (symbol) fetch(`/api/market/quote?symbol=${symbol}`).then((r) => r.json()).then((q) => setLtp(Number(q.last_price) || 0)).catch(() => {}); }, [symbol]);
  if (!symbol) return null;
  const value = Number(form.quantity) * (form.orderType === "MARKET" ? ltp : Number(form.price));
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit() { setSubmitting(true); setMessage(""); try { const response = await fetch("/api/orders", { method: order?.orderId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, orderId: order?.orderId, ...form }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setMessage(`Order submitted: ${body.orderId}`); setConfirming(false); } catch (error) { setMessage(error.message); } finally { setSubmitting(false); } }
  return <div className="modal-backdrop"><section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
    <div className="modal-header"><div><p className="eyebrow">{order?.orderId ? "MODIFY ORDER" : "MANUAL ORDER"}</p><h2 id="order-title">{symbol}</h2></div><button onClick={onClose} aria-label="Close order form">×</button></div>
    {!confirming ? <div className="order-form">
      <label>Side<select value={form.side} onChange={update("side")}><option>BUY</option><option>SELL</option></select></label><label>Product<select value={form.product} onChange={update("product")}><option>MIS</option><option>CNC</option><option>NRML</option></select></label><label>Order type<select value={form.orderType} onChange={update("orderType")}><option>MARKET</option><option>LIMIT</option><option>SL</option><option>SL-M</option></select></label><label>Quantity<input type="number" min="1" value={form.quantity} onChange={update("quantity")} /></label>
      {form.orderType !== "MARKET" && <label>Price<input type="number" min="0" step="0.05" value={form.price} onChange={update("price")} /></label>}{form.orderType.startsWith("SL") && <label>Trigger price<input type="number" min="0" step="0.05" value={form.triggerPrice} onChange={update("triggerPrice")} /></label>}<label>Validity<select value={form.validity} onChange={update("validity")}><option>DAY</option><option>IOC</option></select></label><button className="primary-button" onClick={() => setConfirming(true)}>Review order</button>
    </div> : <div className="confirmation-card"><h3>Confirm real order</h3><p>{form.side} {form.quantity} × {symbol} as {form.product} / {form.orderType}</p><strong>Estimated value: ₹{Number.isFinite(value) ? value.toLocaleString("en-IN") : "—"}</strong><p className="fine-print">This sends a real order to Zerodha. Scan matches are never submitted automatically.</p><div className="editor-actions"><button onClick={() => setConfirming(false)}>Back</button><button className="primary-button" onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Confirm & place"}</button></div></div>}
    {message && <div className={message.startsWith("Order submitted") ? "success-banner" : "error-banner"}>{message}</div>}
  </section></div>;
}
