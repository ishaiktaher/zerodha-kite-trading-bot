import test from "node:test";
import assert from "node:assert/strict";
import { evaluateConditions, evaluateGroup } from "../lib/screener.js";

const candles = Array.from({ length: 30 }, (_, index) => ({ date: `2026-01-${String(index + 1).padStart(2, "0")}`, open: 100 + index, high: 103 + index, low: 99 + index, close: 101 + index, volume: 1000 + index * 10 }));
const green = { id: "green", indicator: "open", operator: "lt", rightType: "indicator", rightIndicator: "close", offset: 0, rightOffset: 0 };
const impossible = { id: "impossible", indicator: "close", operator: "lt", rightType: "value", value: 0, offset: 0 };

test("AND/OR evaluator handles grouped conditions", () => {
  assert.equal(evaluateGroup(candles, { logic: "AND", items: [green, impossible] }).matched, false);
  assert.equal(evaluateGroup(candles, { logic: "OR", items: [green, impossible] }).matched, true);
});

test("saved filter integration matches only qualifying mocked symbols", () => {
  const red = candles.map((item) => ({ ...item, open: item.close + 2 }));
  const filter = { logic: "AND", items: [green] };
  const matches = Object.entries({ INFY: candles, TCS: red }).filter(([, data]) => evaluateConditions(data, filter).matched).map(([symbol]) => symbol);
  assert.deepEqual(matches, ["INFY"]);
});

test("indicatorValue evaluates highest_high and bullish_fvg accurately", () => {
  const fvgCandles = [
    { date: "2026-01-01", open: 10, high: 20, low: 10, close: 15 },
    { date: "2026-01-02", open: 16, high: 40, low: 16, close: 38 },
    { date: "2026-01-03", open: 38, high: 50, low: 25, close: 45 },
  ];
  const evalResult = evaluateConditions(fvgCandles, [
    { id: "fvg-check", indicator: "bullish_fvg", operator: "eq", rightType: "value", value: 1, offset: 0 },
    { id: "highest-check", indicator: "highest_high", period: 2, operator: "gte", rightType: "value", value: 40, offset: 0 },
  ]);
  assert.equal(evalResult.matched, true);
});

