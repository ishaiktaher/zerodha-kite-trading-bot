/**
 * Market Structure (Fractal) adaptation for personal, non-commercial use.
 * Based on “Market Structure CHoCH/BOS (Fractal)” by LuxAlgo.
 * Original work: https://www.tradingview.com/script/ZpHqSrBK-Market-Structure-CHoCH-BOS-Fractal-LuxAlgo/
 * Licence: CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

function finiteCandles(candles) {
  return candles.map((candle) => ({
    ...candle,
    open: Number(candle.open), high: Number(candle.high), low: Number(candle.low), close: Number(candle.close), volume: Number(candle.volume || 0),
  }));
}

function isSwingHigh(candles, pivot, half) {
  for (let index = pivot - half + 1; index <= pivot; index += 1) if (candles[index].high <= candles[index - 1].high) return false;
  for (let index = pivot + 1; index <= pivot + half; index += 1) if (candles[index].high >= candles[index - 1].high) return false;
  return true;
}

function isSwingLow(candles, pivot, half) {
  for (let index = pivot - half + 1; index <= pivot; index += 1) if (candles[index].low >= candles[index - 1].low) return false;
  for (let index = pivot + 1; index <= pivot + half; index += 1) if (candles[index].low <= candles[index - 1].low) return false;
  return true;
}

function extremeBetween(candles, from, to, key, comparator) {
  let selected = from;
  for (let index = from + 1; index <= to; index += 1) if (comparator(candles[index][key], candles[selected][key])) selected = index;
  return { index: selected, price: candles[selected][key] };
}

export function calculateMarketStructure(input, length = 5) {
  if (!Array.isArray(input)) return { events: [], structures: [], levels: [], series: [] };
  const candles = finiteCandles(input);
  const normalizedLength = Math.max(3, Math.floor(Number(length) || 5));
  const half = Math.floor(normalizedLength / 2);
  const events = [];
  const structures = [];
  const levels = [];
  const series = Array.from({ length: candles.length }, () => []);
  let upper = null;
  let lower = null;
  let support = null;
  let resistance = null;
  let orientation = 0;
  let bullishFractals = 0;
  let bearishFractals = 0;
  let bullishStructures = 0;
  let bearishStructures = 0;

  function record(event) { events.push(event); series[event.index].push(event.type); }

  for (let index = half * 2; index < candles.length; index += 1) {
    const pivot = index - half;
    if (isSwingHigh(candles, pivot, half)) { upper = { index: pivot, price: candles[pivot].high, crossed: false }; bullishFractals += 1; }
    if (isSwingLow(candles, pivot, half)) { lower = { index: pivot, price: candles[pivot].low, crossed: false }; bearishFractals += 1; }

    const previousClose = candles[index - 1]?.close;
    const bullishBreak = upper && !upper.crossed && candles[index].close > upper.price && previousClose <= upper.price;
    if (bullishBreak) {
      const type = orientation === -1 ? "BULLISH_CHOCH" : "BULLISH_BOS";
      const event = { type, direction: "bullish", index, swingIndex: upper.index, price: upper.price };
      record(event); structures.push(event); upper.crossed = true; bullishStructures += 1; orientation = 1;
      if (index - upper.index > 1) {
        const level = extremeBetween(candles, upper.index + 1, index - 1, "low", (left, right) => left < right);
        support = { type: "support", startIndex: level.index, endIndex: candles.length - 1, price: level.price, broken: false };
        levels.push(support);
      }
    } else if (support && !support.broken && candles[index].close < support.price) {
      support.broken = true; support.endIndex = index;
      record({ type: "SUPPORT_BREAK", direction: "bearish", index, levelIndex: support.startIndex, price: support.price });
    }

    const bearishBreak = lower && !lower.crossed && candles[index].close < lower.price && previousClose >= lower.price;
    if (bearishBreak) {
      const type = orientation === 1 ? "BEARISH_CHOCH" : "BEARISH_BOS";
      const event = { type, direction: "bearish", index, swingIndex: lower.index, price: lower.price };
      record(event); structures.push(event); lower.crossed = true; bearishStructures += 1; orientation = -1;
      if (index - lower.index > 1) {
        const level = extremeBetween(candles, lower.index + 1, index - 1, "high", (left, right) => left > right);
        resistance = { type: "resistance", startIndex: level.index, endIndex: candles.length - 1, price: level.price, broken: false };
        levels.push(resistance);
      }
    } else if (resistance && !resistance.broken && candles[index].close > resistance.price) {
      resistance.broken = true; resistance.endIndex = index;
      record({ type: "RESISTANCE_BREAK", direction: "bullish", index, levelIndex: resistance.startIndex, price: resistance.price });
    }
  }

  return {
    events, structures, levels, series,
    orientation: orientation === 1 ? "bullish" : orientation === -1 ? "bearish" : "neutral",
    stats: {
      bullishFractals, bearishFractals, bullishStructures, bearishStructures,
      bullishStructurePercent: bullishFractals ? (bullishStructures / bullishFractals) * 100 : 0,
      bearishStructurePercent: bearishFractals ? (bearishStructures / bearishFractals) * 100 : 0,
    },
  };
}

export function marketStructureSignal(candles, indicator, offset = 0, length = 5) {
  const index = candles.length - 1 - Math.max(0, Number(offset) || 0);
  const type = {
    bullish_bos: "BULLISH_BOS", bearish_bos: "BEARISH_BOS", bullish_choch: "BULLISH_CHOCH", bearish_choch: "BEARISH_CHOCH",
    support_break: "SUPPORT_BREAK", resistance_break: "RESISTANCE_BREAK",
  }[indicator];
  if (!type || index < 0) return 0;
  return calculateMarketStructure(candles, length).series[index]?.includes(type) ? 1 : 0;
}
