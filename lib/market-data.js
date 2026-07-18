import { getInstrumentMaster } from "@/lib/universe";
import { withBackoff } from "@/lib/batch";

const INTERVALS = { day: "day", week: "week", "15minute": "15minute", "60minute": "60minute" };

export class KiteDataProvider {
  constructor(kite) { this.kite = kite; }
  async instruments() { return getInstrumentMaster(this.kite); }
  async candles(symbol, timeframe = "day", days = 370) {
    const instrument = (await this.instruments()).find((item) => item.tradingsymbol === symbol);
    if (!instrument) throw new Error(`Unknown NSE equity ${symbol}`);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const date = (value) => value.toISOString().slice(0, 10);
    return withBackoff(() => this.kite.getHistoricalData(instrument.instrument_token, INTERVALS[timeframe] || "day", date(from), date(to), false, false));
  }
}

