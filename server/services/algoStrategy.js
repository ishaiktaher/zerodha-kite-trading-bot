const talib = require("talib");

module.exports = {
  calculateRSI: (closes, period = 14) => {
    return talib.RSI(closes, period);
  },
  calculateEMA: (closes, period = 20) => {
    return talib.EMA(closes, period);
  },
  evaluateTrade: (closes) => {
    const rsi = this.calculateRSI(closes);
    const ema = this.calculateEMA(closes);
    const lastClose = closes[closes.length - 1];
    const lastRSI = rsi[rsi.length - 1];
    const lastEMA = ema[ema.length - 1];

    return {
      shouldBuy: lastRSI < 30 && lastClose > lastEMA,
      shouldSell: lastRSI > 70 || lastClose < lastEMA,
      rsi: lastRSI,
      ema: lastEMA,
    };
  },
};
