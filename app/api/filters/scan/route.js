import { apiError, getAuthenticatedKite } from "@/lib/kite";
import { evaluateConditions, INDICATORS, NIFTY_50_SYMBOLS, OPERATORS } from "@/lib/screener";

export const runtime = "nodejs";
export const maxDuration = 60;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function validateConditions(conditions) {
  const indicatorIds = new Set(INDICATORS.map((indicator) => indicator.id));
  const operatorIds = new Set(OPERATORS.map((operator) => operator.id));
  return Array.isArray(conditions) && conditions.length > 0 && conditions.length <= 10 && conditions.every((condition) => {
    const validLeft = indicatorIds.has(condition.indicator)
      && operatorIds.has(condition.operator)
      && Number.isInteger(Number(condition.offset || 0))
      && Number(condition.offset || 0) >= 0
      && Number(condition.offset || 0) <= 10;
    if (!validLeft) return false;
    if (condition.rightType !== "indicator") return Number.isFinite(Number(condition.value));
    return indicatorIds.has(condition.rightIndicator)
      && Number.isInteger(Number(condition.rightOffset ?? condition.offset ?? 0))
      && Number(condition.rightOffset ?? condition.offset ?? 0) >= 0
      && Number(condition.rightOffset ?? condition.offset ?? 0) <= 10;
  });
}

export async function POST(request) {
  try {
    const { conditions } = await request.json();
    if (!validateConditions(conditions)) {
      return Response.json({ error: "Add between 1 and 10 valid conditions" }, { status: 400 });
    }

    const kite = await getAuthenticatedKite();
    const instruments = await kite.getInstruments("NSE");
    const tokenBySymbol = new Map(
      instruments
        .filter((instrument) => instrument.instrument_type === "EQ" && NIFTY_50_SYMBOLS.includes(instrument.tradingsymbol))
        .map((instrument) => [instrument.tradingsymbol, instrument.instrument_token])
    );
    const to = new Date();
    const from = new Date(to.getTime() - 180 * 86400000);
    const formatDate = (value) => value.toISOString().slice(0, 10);
    const matches = [];
    const failures = [];

    for (const symbol of NIFTY_50_SYMBOLS) {
      const token = tokenBySymbol.get(symbol);
      if (!token) continue;
      try {
        const candles = await kite.getHistoricalData(token, "day", formatDate(from), formatDate(to), false, false);
        const evaluation = evaluateConditions(candles, conditions);
        if (evaluation.matched) {
          matches.push({ symbol, close: Number(candles.at(-1)?.close), details: evaluation.details });
        }
      } catch (error) {
        failures.push({ symbol, error: error.message || "Data unavailable" });
      }
      await pause(340);
    }

    return Response.json({ matches, scanned: tokenBySymbol.size, failures: failures.length, universe: "NIFTY 50" });
  } catch (error) {
    return apiError(error);
  }
}
