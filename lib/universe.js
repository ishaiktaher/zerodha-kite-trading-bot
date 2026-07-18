import { NIFTY_50_SYMBOLS } from "./screener.js";

export const UNIVERSES = ["NIFTY_50", "NIFTY_100", "NIFTY_200", "NIFTY_500", "ALL_NSE_EQUITY", "WATCHLIST"];
let instrumentCache = { expiresAt: 0, instruments: [] };

export function equityInstruments(instruments) {
  return instruments.filter((item) => item.exchange === "NSE" && item.segment === "NSE" && item.instrument_type === "EQ" && item.name && item.lot_size === 1);
}

export async function getInstrumentMaster(kite, now = Date.now()) {
  if (instrumentCache.expiresAt > now && instrumentCache.instruments.length) return instrumentCache.instruments;
  const instruments = equityInstruments(await kite.getInstruments("NSE"));
  instrumentCache = { instruments, expiresAt: now + 24 * 60 * 60 * 1000 };
  return instruments;
}

export function resetInstrumentCache() { instrumentCache = { expiresAt: 0, instruments: [] }; }

export function resolveUniverse(name, instruments, watchlist = []) {
  if (name === "ALL_NSE_EQUITY") return instruments.map((item) => item.tradingsymbol);
  if (name === "WATCHLIST") return [...new Set(watchlist.map((item) => item.trim().toUpperCase()))];
  if (name === "NIFTY_50") return NIFTY_50_SYMBOLS;
  const configured = process.env[`${name}_SYMBOLS`];
  if (!configured) {
    const error = new Error(`${name} constituents are not configured. Add ${name}_SYMBOLS as a comma-separated environment variable.`);
    error.statusCode = 503;
    throw error;
  }
  return configured.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean);
}
