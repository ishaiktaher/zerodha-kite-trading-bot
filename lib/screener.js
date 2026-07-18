import { marketStructureSignal } from "./market-structure.js";

export const INDICATORS = [
  { id: "close", name: "Close", category: "Price", hasPeriod: false },
  { id: "open", name: "Open", category: "Price", hasPeriod: false },
  { id: "high", name: "High", category: "Price", hasPeriod: false },
  { id: "low", name: "Low", category: "Price", hasPeriod: false },
  { id: "volume", name: "Volume", category: "Volume", hasPeriod: false },
  { id: "rsi", name: "RSI", category: "Momentum", hasPeriod: true, defaultPeriod: 14 },
  { id: "sma", name: "Simple Moving Average", category: "Trend", hasPeriod: true, defaultPeriod: 20 },
  { id: "ema", name: "Exponential Moving Average", category: "Trend", hasPeriod: true, defaultPeriod: 20 },
  { id: "highest", name: "Highest Close", category: "Price", hasPeriod: true, defaultPeriod: 252 },
  { id: "volume_sma", name: "Average Volume", category: "Volume", hasPeriod: true, defaultPeriod: 20 },
  { id: "bullish_bos", name: "Bullish BOS", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
  { id: "bearish_bos", name: "Bearish BOS", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
  { id: "bullish_choch", name: "Bullish CHoCH", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
  { id: "bearish_choch", name: "Bearish CHoCH", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
  { id: "support_break", name: "Support Break", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
  { id: "resistance_break", name: "Resistance Break", category: "Market Structure", hasPeriod: true, defaultPeriod: 5 },
];

export const OPERATORS = [
  { id: "gt", label: "Greater than" },
  { id: "gte", label: "Greater than or equal" },
  { id: "lt", label: "Less than" },
  { id: "lte", label: "Less than or equal" },
  { id: "eq", label: "Equal to" },
  { id: "neq", label: "Not equal to" },
  { id: "crosses_above", label: "Crosses above" },
  { id: "crosses_below", label: "Crosses below" },
];

export const NIFTY_50_SYMBOLS = [
  "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK",
  "BAJAJ-AUTO", "BAJFINANCE", "BAJAJFINSV", "BEL", "BHARTIARTL",
  "CIPLA", "COALINDIA", "DRREDDY", "EICHERMOT", "ETERNAL",
  "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO",
  "HINDALCO", "HINDUNILVR", "ICICIBANK", "INDUSINDBK", "INFY",
  "ITC", "JIOFIN", "JSWSTEEL", "KOTAKBANK", "LT", "M&M", "MARUTI",
  "NESTLEIND", "NTPC", "ONGC", "POWERGRID", "RELIANCE", "SBILIFE",
  "SBIN", "SHRIRAMFIN", "SUNPHARMA", "TATACONSUM", "TATAMOTORS",
  "TATASTEEL", "TCS", "TECHM", "TITAN", "TRENT", "ULTRACEMCO", "WIPRO",
];

function series(candles, key) {
  return candles.map((candle) => Number(candle[key]));
}

function sma(values, period) {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    return values.slice(index + 1 - period, index + 1).reduce((sum, value) => sum + value, 0) / period;
  });
}

function ema(values, period) {
  const output = Array(values.length).fill(null);
  if (values.length < period) return output;
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  output[period - 1] = current;
  const multiplier = 2 / (period + 1);
  for (let index = period; index < values.length; index += 1) {
    current = (values[index] - current) * multiplier + current;
    output[index] = current;
  }
  return output;
}

function rsi(values, period) {
  const output = Array(values.length).fill(null);
  if (values.length <= period) return output;
  let gain = 0;
  let loss = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }
  gain /= period;
  loss /= period;
  const value = () => loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  output[period] = value();
  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    gain = (gain * (period - 1) + Math.max(change, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-change, 0)) / period;
    output[index] = value();
  }
  return output;
}

export function indicatorValue(candles, condition) {
  const offset = Math.max(0, Number(condition.offset) || 0);
  const index = candles.length - 1 - offset;
  if (index < 0) return null;
  if (["open", "high", "low", "close", "volume"].includes(condition.indicator)) {
    return Number(candles[index][condition.indicator]);
  }
  if (["bullish_bos", "bearish_bos", "bullish_choch", "bearish_choch", "support_break", "resistance_break"].includes(condition.indicator)) {
    return marketStructureSignal(candles, condition.indicator, offset, condition.period || 5);
  }
  const period = Math.max(2, Number(condition.period) || 14);
  if (condition.indicator === "highest") {
    const start = Math.max(0, index + 1 - period);
    return Math.max(...candles.slice(start, index + 1).map((candle) => Number(candle.close)));
  }
  const base = condition.indicator === "volume_sma" ? series(candles, "volume") : series(candles, "close");
  const values = condition.indicator === "rsi" ? rsi(base, period) : condition.indicator === "ema" ? ema(base, period) : sma(base, period);
  return Number.isFinite(values[index]) ? values[index] * (Number(condition.multiplier) || 1) : values[index];
}

export function evaluateConditions(candles, conditions) {
  if (!Array.isArray(conditions)) return evaluateGroup(candles, conditions);
  const comparisons = {
    gt: (left, right) => left > right,
    gte: (left, right) => left >= right,
    lt: (left, right) => left < right,
    lte: (left, right) => left <= right,
    eq: (left, right) => Math.abs(left - right) < 0.000001,
    neq: (left, right) => Math.abs(left - right) >= 0.000001,
  };
  const details = conditions.map((condition) => {
    const actual = indicatorValue(candles, condition);
    const targetDescriptor = condition.rightType === "indicator" ? {
      indicator: condition.rightIndicator,
      period: condition.rightPeriod,
      multiplier: condition.multiplier,
      offset: condition.rightOffset ?? condition.offset,
    } : null;
    const target = targetDescriptor ? indicatorValue(candles, targetDescriptor) : Number(condition.value);
    let passed = false;
    if (condition.operator === "crosses_above" || condition.operator === "crosses_below") {
      const previousActual = indicatorValue(candles, { ...condition, offset: (Number(condition.offset) || 0) + 1 });
      const previousTarget = targetDescriptor
        ? indicatorValue(candles, { ...targetDescriptor, offset: (Number(targetDescriptor.offset) || 0) + 1 })
        : target;
      passed = condition.operator === "crosses_above"
        ? actual > target && previousActual <= previousTarget
        : actual < target && previousActual >= previousTarget;
      passed = [actual, target, previousActual, previousTarget].every(Number.isFinite) && passed;
    } else {
      passed = Number.isFinite(actual) && Number.isFinite(target) && Boolean(comparisons[condition.operator]?.(actual, target));
    }
    return {
      conditionId: condition.id,
      actual,
      target,
      targetType: targetDescriptor ? "indicator" : "value",
      passed,
    };
  });
  return { matched: details.length > 0 && details.every((detail) => detail.passed), details };
}

export function evaluateGroup(candles, group) {
  if (!group || !Array.isArray(group.items) || !group.items.length) return { matched: false, details: [] };
  const evaluations = group.items.map((item) => item.items ? evaluateGroup(candles, item) : evaluateConditions(candles, [item]));
  return {
    matched: (group.logic || "AND") === "OR" ? evaluations.some((item) => item.matched) : evaluations.every((item) => item.matched),
    details: evaluations.flatMap((item) => item.details),
  };
}

const condition = (indicator, operator, rightIndicator, period, rightPeriod = period) => ({
  id: `${indicator}-${operator}-${rightIndicator}-${period || 0}`,
  indicator, operator, period, offset: 0, rightType: "indicator", rightIndicator, rightPeriod, rightOffset: 0,
});

export const PRESET_SCANS = [
  { id: "three-candle", name: "Three-candle reversal", conditions: { logic: "AND", items: [
    { ...condition("open", "gt", "close"), offset: 2, rightOffset: 2 },
    { ...condition("open", "gt", "close"), offset: 1, rightOffset: 1 },
    condition("open", "lt", "close"),
  ] } },
  { id: "52-week-breakout", name: "52-week breakout", conditions: { logic: "AND", items: [{ id: "breakout", indicator: "close", operator: "gte", rightType: "indicator", rightIndicator: "highest", rightPeriod: 252, offset: 0, rightOffset: 1 }] } },
  { id: "volume-spike", name: "Volume spike", conditions: { logic: "AND", items: [{ id: "volume-spike", indicator: "volume", operator: "gt", rightType: "indicator", rightIndicator: "volume_sma", rightPeriod: 20, multiplier: 2, offset: 0, rightOffset: 0 }] } },
  { id: "rsi-bounce", name: "RSI oversold bounce", conditions: { logic: "AND", items: [{ id: "rsi-bounce", indicator: "rsi", period: 14, operator: "crosses_above", rightType: "value", value: 30, offset: 0 }] } },
  { id: "ema-cross", name: "EMA 20/50 golden cross", conditions: { logic: "AND", items: [condition("ema", "crosses_above", "ema", 20, 50)] } },
  { id: "bullish-choch", name: "Bullish market structure change", conditions: { logic: "AND", items: [{ id: "bullish-choch", indicator: "bullish_choch", period: 5, operator: "eq", rightType: "value", value: 1, offset: 0 }] } },
];
