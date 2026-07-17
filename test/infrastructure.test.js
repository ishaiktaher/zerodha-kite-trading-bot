import test from "node:test";
import assert from "node:assert/strict";
import { mapRateLimited, withBackoff } from "../lib/batch.js";
import { getInstrumentMaster, resetInstrumentCache, resolveUniverse } from "../lib/universe.js";
import { logOrder } from "../lib/db.js";

test("instrument master is filtered and cached for one day", async () => {
  resetInstrumentCache(); let calls = 0;
  const kite = { getInstruments: async () => { calls += 1; return [{ exchange: "NSE", segment: "NSE", instrument_type: "EQ", name: "Infosys", lot_size: 1, tradingsymbol: "INFY" }, { exchange: "NSE", segment: "NSE", instrument_type: "EQ", name: "Bond", lot_size: 100, tradingsymbol: "BOND" }]; } };
  assert.equal((await getInstrumentMaster(kite, 100)).length, 1);
  await getInstrumentMaster(kite, 200); assert.equal(calls, 1);
  assert.deepEqual(resolveUniverse("ALL_NSE_EQUITY", await getInstrumentMaster(kite, 200)), ["INFY"]);
});

test("rate-limited batcher preserves order and retries 429", async () => {
  let attempts = 0;
  const value = await withBackoff(async () => { attempts += 1; if (attempts < 2) throw Object.assign(new Error("rate limit"), { statusCode: 429 }); return 7; }, { baseDelay: 1 });
  assert.equal(value, 7);
  assert.deepEqual(await mapRateLimited([1, 2, 3], async (item) => item * 2, { concurrency: 2, interval: 0 }), [2, 4, 6]);
});

test("order log writes an audit row after ensuring the Kite user", async () => {
  const statements = [];
  const sql = async (strings, ...values) => { const text = strings.join("?"); statements.push({ text, values }); return text.includes("insert into zeta_gain.orders_log") ? [{ id: 1, status: "SUBMITTED" }] : []; };
  const row = await logOrder({ userId: "AB1234", kiteOrderId: "42", symbol: "INFY", side: "BUY", qty: 1, price: null, orderType: "MARKET", product: "MIS", status: "SUBMITTED", action: "PLACE" }, sql);
  assert.equal(row.id, 1); assert.equal(statements.length, 2);
});
