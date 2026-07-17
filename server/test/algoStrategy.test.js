const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateRSI, evaluateLiquidityGrab } = require("../services/algoStrategy");

function candle(open, close, date) {
  return {
    date,
    open,
    high: Math.max(open, close) + 1,
    low: Math.min(open, close) - 1,
    close,
    volume: 1000,
  };
}

function matchingCandles() {
  const closes = [120, 118, 117, 115, 114, 112, 111, 109, 108, 106, 105, 103, 102, 100];
  const history = closes.map((close, index) => candle(close + 1, close, `day-${index + 1}`));
  return [
    ...history,
    candle(101, 99, "two-days-ago"),
    candle(100, 98, "previous-day"),
    candle(97, 103, "present-day"),
  ];
}

test("calculateRSI uses Wilder smoothing and returns values in range", () => {
  const values = calculateRSI([1, 2, 3, 2, 4, 3, 5], 3);
  assert.equal(values.length, 4);
  assert.ok(values.every((value) => value >= 0 && value <= 100));
});

test("matches two red candles, a green present candle, and previous RSI below 50", () => {
  const result = evaluateLiquidityGrab(matchingCandles());
  assert.equal(result.matched, true);
  assert.ok(result.previousCandleRSI < 50);
  assert.deepEqual(result.conditions, {
    firstPreviousCandleRed: true,
    previousCandleRed: true,
    presentCandleGreen: true,
    previousCandleRSIBelowThreshold: true,
  });
});

test("does not match when the present candle is red", () => {
  const candles = matchingCandles();
  candles[candles.length - 1] = candle(104, 102, "present-day");
  const result = evaluateLiquidityGrab(candles);
  assert.equal(result.matched, false);
  assert.equal(result.conditions.presentCandleGreen, false);
});

test("calculates previous-day RSI without using the present-day close", () => {
  const candles = matchingCandles();
  const firstResult = evaluateLiquidityGrab(candles);
  candles[candles.length - 1] = candle(1, 10000, "present-day");
  const secondResult = evaluateLiquidityGrab(candles);
  assert.equal(firstResult.previousCandleRSI, secondResult.previousCandleRSI);
});

test("rejects insufficient candle history", () => {
  assert.throws(
    () => evaluateLiquidityGrab([candle(2, 1), candle(2, 1), candle(1, 2)]),
    /At least 16 daily candles/
  );
});
