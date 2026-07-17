const LOOKBACK_CALENDAR_DAYS = 45;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function resolveInstrumentToken(symbol, kite) {
  const normalizedSymbol = String(symbol).trim().toUpperCase();
  const instruments = await kite.getInstruments("NSE");
  const instrument = instruments.find(
    (item) =>
      item.exchange === "NSE" &&
      item.tradingsymbol === normalizedSymbol &&
      item.instrument_type === "EQ"
  );

  if (!instrument) {
    const error = new Error(`NSE equity symbol '${normalizedSymbol}' was not found`);
    error.statusCode = 404;
    throw error;
  }

  return instrument.instrument_token;
}

async function getHistoricalData(symbol, kite, options = {}) {
  const toDate = options.toDate ? new Date(options.toDate) : new Date();
  const fromDate = options.fromDate
    ? new Date(options.fromDate)
    : new Date(toDate.getTime() - LOOKBACK_CALENDAR_DAYS * 24 * 60 * 60 * 1000);
  const instrumentToken =
    options.instrumentToken ?? (await resolveInstrumentToken(symbol, kite));

  const candles = await kite.getHistoricalData(
    instrumentToken,
    "day",
    formatDate(fromDate),
    formatDate(toDate),
    false,
    false
  );

  return candles.map((candle) => ({
    date: candle.date,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume),
  }));
}

module.exports = {
  getHistoricalData,
  resolveInstrumentToken,
};
