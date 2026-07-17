const DEFAULT_RSI_PERIOD = 14;

function calculateRSI(closes, period = DEFAULT_RSI_PERIOD) {
  if (!Array.isArray(closes) || closes.length <= period) return [];
  const values = closes.map(Number);
  let averageGain = 0;
  let averageLoss = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }
  averageGain /= period;
  averageLoss /= period;

  const toRSI = () => {
    if (averageLoss === 0) return averageGain === 0 ? 50 : 100;
    if (averageGain === 0) return 0;
    return 100 - 100 / (1 + averageGain / averageLoss);
  };
  const results = [toRSI()];

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    results.push(toRSI());
  }
  return results;
}

export function evaluateLiquidityGrab(candles, rsiPeriod = DEFAULT_RSI_PERIOD) {
  if (!Array.isArray(candles) || candles.length < rsiPeriod + 2) {
    throw new Error(`At least ${rsiPeriod + 2} daily candles are required`);
  }
  const [firstPrevious, previous, present] = candles.slice(-3);
  const rsi = calculateRSI(candles.slice(0, -1).map((candle) => candle.close), rsiPeriod).at(-1);
  const conditions = {
    firstPreviousCandleRed: firstPrevious.close < firstPrevious.open,
    previousCandleRed: previous.close < previous.open,
    presentCandleGreen: present.close > present.open,
    previousCandleRSIBelowThreshold: rsi < 50,
  };
  return {
    matched: Object.values(conditions).every(Boolean),
    conditions,
    previousCandleRSI: rsi,
    rsiPeriod,
    candles: { firstPrevious, previous, present },
  };
}

export async function getDailyCandles(kite, symbol) {
  const normalized = symbol.trim().toUpperCase();
  const instruments = await kite.getInstruments("NSE");
  const instrument = instruments.find(
    (item) => item.tradingsymbol === normalized && item.instrument_type === "EQ"
  );
  if (!instrument) {
    const error = new Error(`NSE equity symbol '${normalized}' was not found`);
    error.statusCode = 404;
    throw error;
  }
  const to = new Date();
  const from = new Date(to.getTime() - 45 * 86400000);
  const date = (value) => value.toISOString().slice(0, 10);
  return kite.getHistoricalData(
    instrument.instrument_token,
    "day",
    date(from),
    date(to),
    false,
    false
  );
}
