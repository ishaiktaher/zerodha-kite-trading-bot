import { getInstrumentMaster } from "@/lib/universe";
import { withBackoff } from "@/lib/batch";

const INTERVALS = {
  day: "day",
  week: "week",
  "15minute": "15minute",
  "5minute": "5minute",
  "60minute": "60minute",
};

const DEFAULT_DAYS = {
  day: 370,
  week: 730,
  "60minute": 60,
  "15minute": 15,
  "5minute": 5,
};

export class KiteDataProvider {
  constructor(kite) { this.kite = kite; }
  async instruments() { return getInstrumentMaster(this.kite); }
  async candles(symbol, timeframe = "day", days) {
    const instrument = (await this.instruments()).find((item) => item.tradingsymbol === symbol);
    if (!instrument) throw new Error(`Unknown NSE equity ${symbol}`);
    const lookbackDays = days || DEFAULT_DAYS[timeframe] || 370;
    const to = new Date();
    const from = new Date(to.getTime() - lookbackDays * 86400000);
    const date = (value) => value.toISOString().slice(0, 10);
    return withBackoff(() => this.kite.getHistoricalData(instrument.instrument_token, INTERVALS[timeframe] || "day", date(from), date(to), false, false));
  }
}

