import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHighestHigh,
  detect15mBreakout,
  find5mTriggerCandle,
  checkCutCandleFVG,
  detectAllFVGs,
  evaluateBreakoutFVGStrategy,
} from "../lib/breakout-fvg.js";

function makeCandle(offsetMinutes, { open, high, low, close }) {
  const base = new Date("2026-10-30T09:15:00+05:30").getTime();
  const date = new Date(base + offsetMinutes * 60 * 1000).toISOString();
  return { date, open, high, low, close, volume: 1000 };
}

test("calculateHighestHigh computes correct maximum over 14 candles", () => {
  const candles = Array.from({ length: 20 }, (_, i) => ({
    high: 100 + i, // 100..119
  }));

  // Lookback 14 over index 0..13 -> max is 113
  const h14 = calculateHighestHigh(candles, 14, 13);
  assert.equal(h14, 113);
});

test("detect15mBreakout correctly detects sweep (high > H14 AND close < H14)", () => {
  const candles15m = Array.from({ length: 14 }, (_, i) =>
    makeCandle(i * 15, { open: 100, high: 110, low: 95, close: 105 })
  );

  // 15th candle sweeps above 110 (high = 115) but closes at 108 (< 110)
  candles15m.push(
    makeCandle(14 * 15, { open: 106, high: 115, low: 104, close: 108 })
  );

  const result = detect15mBreakout(candles15m, { lookback: 14 });
  assert.equal(result.matched, true);
  assert.equal(result.h14, 110);
  assert.equal(result.brokenHigh, true);
  assert.equal(result.closedBelow, true);
  assert.equal(result.high, 115);
  assert.equal(result.close, 108);
});

test("detect15mBreakout fails if candle closes above H14 (not a rejection)", () => {
  const candles15m = Array.from({ length: 14 }, (_, i) =>
    makeCandle(i * 15, { open: 100, high: 110, low: 95, close: 105 })
  );

  // High = 115, Close = 112 (> 110)
  candles15m.push(
    makeCandle(14 * 15, { open: 106, high: 115, low: 104, close: 112 })
  );

  const result = detect15mBreakout(candles15m, { lookback: 14 });
  assert.equal(result.brokenHigh, true);
  assert.equal(result.closedBelow, false);
  assert.equal(result.matched, false);
});

test("find5mTriggerCandle finds the exact 5m candle that cut H14 in the 15m window", () => {
  const windowStart = new Date("2026-10-30T10:00:00+05:30").getTime();
  const windowEnd = windowStart + 15 * 60 * 1000;

  const candles5m = [
    // 10:00 - below H14
    { date: new Date(windowStart).toISOString(), open: 105, high: 109, low: 104, close: 108 },
    // 10:05 - cuts H14 (110)
    { date: new Date(windowStart + 5 * 60000).toISOString(), open: 108, high: 115, low: 107, close: 109 },
    // 10:10
    { date: new Date(windowStart + 10 * 60000).toISOString(), open: 109, high: 109.5, low: 105, close: 106 },
  ];

  const trigger = find5mTriggerCandle(candles5m, 110, windowStart, windowEnd);
  assert.ok(trigger);
  assert.equal(trigger.cutIndex, 1);
  assert.equal(trigger.high, 115);
  assert.equal(trigger.cutHigh, true);
  assert.equal(trigger.closedBelow, true);
});

test("checkCutCandleFVG detects Bullish FVG when cut candle is Candle 3 (Low(C3) > High(C1))", () => {
  const candles5m = [
    // C1: High = 100, Low = 95
    { open: 96, high: 100, low: 95, close: 98 },
    // C2: Impulse candle
    { open: 99, high: 112, low: 98, close: 110 },
    // C3: Cut candle (cutIndex = 2): Low = 104, High = 115
    { open: 110, high: 115, low: 104, close: 109 },
  ];

  const fvg = checkCutCandleFVG(candles5m, 2);
  assert.equal(fvg.exists, true);
  assert.equal(fvg.type, "bullish");
  assert.equal(fvg.top, 104); // C3.low
  assert.equal(fvg.bottom, 100); // C1.high
  assert.equal(fvg.gapSize, 4);
});

test("checkCutCandleFVG returns exists=false when C3.low overlaps C1.high", () => {
  const candles5m = [
    // C1: High = 105
    { open: 96, high: 105, low: 95, close: 98 },
    // C2: Middle candle
    { open: 99, high: 112, low: 98, close: 110 },
    // C3: Cut candle with Low = 102 (overlaps C1.high 105)
    { open: 110, high: 115, low: 102, close: 109 },
  ];

  const fvg = checkCutCandleFVG(candles5m, 2);
  assert.equal(fvg.exists, false);
});

test("detectAllFVGs finds all gaps in series", () => {
  const candles = [
    { time: 1, open: 10, high: 20, low: 10, close: 15 },
    { time: 2, open: 16, high: 40, low: 16, close: 38 },
    { time: 3, open: 38, high: 50, low: 25, close: 45 }, // Low(25) > High(20) -> Bullish FVG [20, 25]
  ];
  const all = detectAllFVGs(candles);
  assert.equal(all.length, 1);
  assert.equal(all[0].type, "bullish");
  assert.equal(all[0].bottom, 20);
  assert.equal(all[0].top, 25);
});

test("evaluateBreakoutFVGStrategy end-to-end integration test", () => {
  const baseTime = new Date("2026-10-30T09:15:00+05:30").getTime();

  // Create 14 candles of 15m where max high is 100
  const candles15m = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(baseTime + i * 15 * 60000).toISOString(),
    open: 90,
    high: 100,
    low: 85,
    close: 95,
  }));

  // 15th candle at index 14 sweeps to 110, closes at 98 (< 100)
  const windowTime = baseTime + 14 * 15 * 60000;
  candles15m.push({
    date: new Date(windowTime).toISOString(),
    open: 95,
    high: 110,
    low: 92,
    close: 98,
  });

  // Create corresponding 5m candles
  const candles5m = [
    // Preceding 5m candles before the window
    { date: new Date(windowTime - 10 * 60000).toISOString(), open: 92, high: 95, low: 90, close: 94 },
    { date: new Date(windowTime - 5 * 60000).toISOString(), open: 94, high: 98, low: 93, close: 97 },
    // Inside the 15m window:
    // 5m Candle 0 (C1): High = 97
    { date: new Date(windowTime).toISOString(), open: 95, high: 97, low: 92, close: 96 },
    // 5m Candle 1 (C2): Middle impulse candle (stays below H14 100)
    { date: new Date(windowTime + 5 * 60000).toISOString(), open: 96, high: 99, low: 95, close: 98 },
    // 5m Candle 2 (C3): Cut candle that pierces 100 (high=110), low=101 (> C1 high 97)
    { date: new Date(windowTime + 10 * 60000).toISOString(), open: 98, high: 110, low: 101, close: 98 },
  ];

  const result = evaluateBreakoutFVGStrategy({ candles15m, candles5m, lookback: 14 });
  assert.equal(result.matched, true);
  assert.equal(result.status, "PATTERN_MATCHED");
  assert.equal(result.htf.h14, 100);
  assert.equal(result.htf.high, 110);
  assert.equal(result.htf.close, 98);
  assert.equal(result.ltf.cutIndex, 4);
  assert.equal(result.fvg.exists, true);
  assert.equal(result.fvg.type, "bullish");
  assert.equal(result.fvg.bottom, 97);
  assert.equal(result.fvg.top, 101);
  assert.equal(result.fvg.gapSize, 4);
});
