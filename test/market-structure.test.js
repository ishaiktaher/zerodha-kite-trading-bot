import test from "node:test";
import assert from "node:assert/strict";
import { calculateMarketStructure, marketStructureSignal } from "../lib/market-structure.js";

const rows = [
  [8, 10, 6], [10, 12, 7], [12, 15, 8], [11, 14, 7], [12, 13, 6],
  [16, 16, 8], [9, 13, 7], [6, 11, 4], [7, 12, 5], [7, 13, 6], [3, 10, 2], [2, 8, 1],
];
const candles = rows.map(([close, high, low], index) => ({ date: `2026-01-${String(index + 1).padStart(2, "0")}`, open: close, high, low, close, volume: 1000 }));

test("market structure confirms a fractal before emitting bullish BOS", () => {
  assert.equal(calculateMarketStructure(candles.slice(0, 5), 5).events.length, 0);
  const result = calculateMarketStructure(candles.slice(0, 6), 5);
  assert.equal(result.events[0].type, "BULLISH_BOS");
  assert.equal(result.events[0].swingIndex, 2);
  assert.equal(result.events[0].index, 5);
});

test("opposite break becomes CHoCH and a fractal is crossed only once", () => {
  const result = calculateMarketStructure(candles, 5);
  assert.equal(result.events.filter((event) => event.type === "BULLISH_BOS").length, 1);
  assert.equal(result.events.filter((event) => event.type === "BEARISH_CHOCH").length, 1);
  assert.equal(result.orientation, "bearish");
  assert.equal(result.levels[0].type, "support");
  assert.equal(result.levels[0].broken, true);
});

test("market structure events are available as scanner signals", () => {
  assert.equal(marketStructureSignal(candles.slice(0, 6), "bullish_bos", 0, 5), 1);
  assert.equal(marketStructureSignal(candles.slice(0, 6), "bullish_choch", 0, 5), 0);
});
