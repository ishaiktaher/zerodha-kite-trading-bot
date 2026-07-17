const DEFAULT_RSI_PERIOD = 14;

function calculateRSI(closes, period = DEFAULT_RSI_PERIOD) {
  if (!Array.isArray(closes) || closes.length <= period) {
    return [];
  }

  const values = closes.map(Number);
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("Closing prices must be finite numbers");
  }

  let averageGain = 0;
  let averageLoss = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }

  averageGain /= period;
  averageLoss /= period;

  const results = [toRSI(averageGain, averageLoss)];

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    results.push(toRSI(averageGain, averageLoss));
  }

  return results;
}

function toRSI(averageGain, averageLoss) {
  if (averageLoss === 0) return averageGain === 0 ? 50 : 100;
  if (averageGain === 0) return 0;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

function isRed(candle) {
  return Number(candle.close) < Number(candle.open);
}

function isGreen(candle) {
  return Number(candle.close) > Number(candle.open);
}

function validateCandles(candles, rsiPeriod) {
  if (!Array.isArray(candles)) {
    throw new TypeError("Candles must be an array");
  }

  if (candles.length < rsiPeriod + 2) {
    throw new RangeError(
      `At least ${rsiPeriod + 2} daily candles are required for RSI(${rsiPeriod})`
    );
  }

  for (const candle of candles) {
    if (![candle.open, candle.high, candle.low, candle.close].every((value) => Number.isFinite(Number(value)))) {
      throw new TypeError("Every candle must contain numeric open, high, low, and close values");
    }
  }
}

/**
 * Detects the requested three-daily-candle liquidity-grab setup:
 *   - two previous candles are red;
 *   - the present-day candle is green; and
 *   - RSI at the previous day's close is below 50.
 *
 * Today's candle is intentionally excluded from the RSI input so an intraday
 * price change cannot alter the RSI value being tested for yesterday.
 */
function evaluateLiquidityGrab(candles, options = {}) {
  const rsiPeriod = options.rsiPeriod ?? DEFAULT_RSI_PERIOD;
  const rsiThreshold = options.rsiThreshold ?? 50;
  validateCandles(candles, rsiPeriod);

  const [firstRedCandidate, previousCandle, presentCandle] = candles.slice(-3);
  const closesThroughPreviousDay = candles.slice(0, -1).map((candle) => candle.close);
  const rsiValues = calculateRSI(closesThroughPreviousDay, rsiPeriod);
  const previousCandleRSI = rsiValues.at(-1);

  const conditions = {
    firstPreviousCandleRed: isRed(firstRedCandidate),
    previousCandleRed: isRed(previousCandle),
    presentCandleGreen: isGreen(presentCandle),
    previousCandleRSIBelowThreshold: previousCandleRSI < rsiThreshold,
  };

  return {
    matched: Object.values(conditions).every(Boolean),
    conditions,
    previousCandleRSI,
    rsiPeriod,
    rsiThreshold,
    candles: {
      firstPrevious: firstRedCandidate,
      previous: previousCandle,
      present: presentCandle,
    },
  };
}

module.exports = {
  calculateRSI,
  evaluateLiquidityGrab,
  isGreen,
  isRed,
};
