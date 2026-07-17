const test = require("node:test");
const assert = require("node:assert/strict");
const { getHistoricalData, resolveInstrumentToken } = require("../services/dataService");

test("resolves an NSE equity instrument token case-insensitively", async () => {
  const kite = {
    getInstruments: async (exchange) => {
      assert.equal(exchange, "NSE");
      return [
        { exchange: "NSE", tradingsymbol: "INFY", instrument_type: "EQ", instrument_token: 408065 },
      ];
    },
  };

  assert.equal(await resolveInstrumentToken("infy", kite), 408065);
});

test("requests daily Kite candles by instrument token and preserves OHLC data", async () => {
  const calls = [];
  const kite = {
    getHistoricalData: async (...args) => {
      calls.push(args);
      return [
        {
          date: "2026-07-16T00:00:00+0530",
          open: 100,
          high: 110,
          low: 98,
          close: 108,
          volume: 12345,
        },
      ];
    },
  };

  const result = await getHistoricalData("INFY", kite, {
    instrumentToken: 408065,
    fromDate: "2026-06-01",
    toDate: "2026-07-16",
  });

  assert.deepEqual(calls[0], [408065, "day", "2026-06-01", "2026-07-16", false, false]);
  assert.deepEqual(result[0], {
    date: "2026-07-16T00:00:00+0530",
    open: 100,
    high: 110,
    low: 98,
    close: 108,
    volume: 12345,
  });
});
