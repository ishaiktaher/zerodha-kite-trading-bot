/**
 * Multi-Timeframe 15m Breakout + 5m Fair Value Gap (FVG) Strategy Engine
 *
 * Rules:
 * 1. 15-minute timeframe: Price breaks the highest high of the previous 14 candles,
 *    but closes below that level (High > H14 AND Close < H14 - Liquidity sweep / rejection).
 * 2. 5-minute timeframe: Within the 15m window, locate the candle that cut H14.
 * 3. FVG check: The cut candle acts as Candle 3 (C3) of a 3-candle Fair Value Gap sequence (C1, C2, C3):
 *    - Bullish FVG: Low(C3) > High(C1)
 *    - Bearish FVG: High(C3) < Low(C1)
 */

export const DEFAULT_LOOKBACK = 14;

/**
 * Calculates highest high over a given lookback period.
 */
export function calculateHighestHigh(candles, period = DEFAULT_LOOKBACK, endIndex) {
  const end = endIndex !== undefined ? endIndex : candles.length - 1;
  const start = Math.max(0, end - period + 1);
  if (end < 0 || start > end) return null;
  return Math.max(...candles.slice(start, end + 1).map((c) => Number(c.high)));
}

/**
 * Detects whether a 15m candle broke/swept the high of the previous N candles.
 */
export function detect15mBreakout(candles15m, options = {}) {
  const { lookback = DEFAULT_LOOKBACK, candleIndex = candles15m.length - 1 } = options;
  if (!Array.isArray(candles15m) || candles15m.length <= lookback || candleIndex < lookback) {
    return { matched: false, reason: `Need at least ${lookback + 1} candles` };
  }

  const targetCandle = candles15m[candleIndex];
  const high = Number(targetCandle.high);
  const close = Number(targetCandle.close);
  const h14 = calculateHighestHigh(candles15m, lookback, candleIndex - 1);

  const brokenHigh = high > h14;
  const closedBelow = close < h14;
  const matched = brokenHigh && closedBelow;

  const candleTime = new Date(targetCandle.date || targetCandle.time).getTime();
  const windowStart = candleTime;
  const windowEnd = candleTime + 15 * 60 * 1000;

  return {
    matched,
    h14,
    candleIndex,
    candle: targetCandle,
    high,
    close,
    brokenHigh,
    closedBelow,
    windowStart,
    windowEnd,
  };
}

/**
 * Finds the 5m candle that cut/pierced H14 within the 15m window.
 */
export function find5mTriggerCandle(candles5m, h14, windowStart, windowEnd) {
  if (!Array.isArray(candles5m) || !candles5m.length) return null;

  for (let index = 0; index < candles5m.length; index += 1) {
    const candle = candles5m[index];
    const time = new Date(candle.date || candle.time).getTime();

    // Check if candle falls within window (with 10-second tolerance for timestamp formatting)
    const inWindow = windowStart && windowEnd
      ? time >= windowStart - 10000 && time < windowEnd
      : true;

    if (inWindow && Number(candle.high) > h14) {
      return {
        cutIndex: index,
        candle,
        time,
        high: Number(candle.high),
        close: Number(candle.close),
        cutHigh: Number(candle.high) > h14,
        closedBelow: Number(candle.close) < h14,
      };
    }
  }

  return null;
}

/**
 * Evaluates whether the cut candle acts as Candle 3 (C3) of a 3-candle Fair Value Gap:
 * C1 = candles[cutIndex - 2]
 * C2 = candles[cutIndex - 1]
 * C3 = candles[cutIndex] (the cut candle)
 */
export function checkCutCandleFVG(candles5m, cutIndex) {
  if (!Array.isArray(candles5m) || cutIndex < 2 || cutIndex >= candles5m.length) {
    return { exists: false, reason: "Insufficient candles before cut candle for 3-candle sequence" };
  }

  const c1 = candles5m[cutIndex - 2];
  const c2 = candles5m[cutIndex - 1];
  const c3 = candles5m[cutIndex];

  const c1High = Number(c1.high);
  const c1Low = Number(c1.low);
  const c3High = Number(c3.high);
  const c3Low = Number(c3.low);

  const isBullish = c3Low > c1High;
  const isBearish = c3High < c1Low;

  if (!isBullish && !isBearish) {
    return {
      exists: false,
      c1,
      c2,
      c3,
      c1High,
      c3Low,
      c1Low,
      c3High,
      overlap: true,
    };
  }

  const type = isBullish ? "bullish" : "bearish";
  const top = isBullish ? c3Low : c1Low;
  const bottom = isBullish ? c1High : c3High;
  const gapSize = Number((top - bottom).toFixed(2));
  const gapPercent = Number(((gapSize / bottom) * 100).toFixed(2));

  // Check if subsequent candles mitigated (tested or filled) the gap
  let isMitigated = false;
  let mitigatedBy = null;
  for (let i = cutIndex + 1; i < candles5m.length; i += 1) {
    const nextCandle = candles5m[i];
    const nextLow = Number(nextCandle.low);
    const nextHigh = Number(nextCandle.high);

    if (isBullish && nextLow <= top) {
      isMitigated = true;
      mitigatedBy = nextCandle;
      break;
    }
    if (isBearish && nextHigh >= bottom) {
      isMitigated = true;
      mitigatedBy = nextCandle;
      break;
    }
  }

  return {
    exists: true,
    type,
    top,
    bottom,
    gapSize,
    gapPercent,
    isMitigated,
    mitigatedBy,
    c1,
    c2,
    c3,
    cutIndex,
  };
}

/**
 * Detects all 3-candle Fair Value Gaps in a candle series (useful for chart overlays).
 */
export function detectAllFVGs(candles) {
  if (!Array.isArray(candles) || candles.length < 3) return [];
  const fvgs = [];

  for (let i = 2; i < candles.length; i += 1) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    const c1High = Number(c1.high);
    const c1Low = Number(c1.low);
    const c3High = Number(c3.high);
    const c3Low = Number(c3.low);

    if (c3Low > c1High) {
      const top = c3Low;
      const bottom = c1High;
      fvgs.push({
        index: i,
        type: "bullish",
        top,
        bottom,
        gapSize: Number((top - bottom).toFixed(2)),
        time: c3.date || c3.time,
        c1Time: c1.date || c1.time,
      });
    } else if (c3High < c1Low) {
      const top = c1Low;
      const bottom = c3High;
      fvgs.push({
        index: i,
        type: "bearish",
        top,
        bottom,
        gapSize: Number((top - bottom).toFixed(2)),
        time: c3.date || c3.time,
        c1Time: c1.date || c1.time,
      });
    }
  }
  return fvgs;
}

/**
 * Complete Multi-Timeframe Strategy Evaluator.
 */
export function evaluateBreakoutFVGStrategy({ candles15m, candles5m, lookback = DEFAULT_LOOKBACK }) {
  if (!Array.isArray(candles15m) || !Array.isArray(candles5m)) {
    throw new Error("Both candles15m and candles5m arrays are required");
  }

  // 1. Check 15m breakout condition (test latest completed candle or present candle)
  const htfResult = detect15mBreakout(candles15m, { lookback });

  if (!htfResult.brokenHigh) {
    return {
      matched: false,
      status: "NO_15M_BREAKOUT",
      message: `15m candle did not break H14 (Level: ₹${htfResult.h14}, High: ₹${htfResult.high})`,
      htf: htfResult,
      ltf: null,
      fvg: null,
    };
  }

  if (!htfResult.closedBelow) {
    return {
      matched: false,
      status: "15M_CLOSED_ABOVE_H14",
      message: `15m candle broke H14 but did not close below it (Close: ₹${htfResult.close} >= H14: ₹${htfResult.h14})`,
      htf: htfResult,
      ltf: null,
      fvg: null,
    };
  }

  // 2. Reduce to 5m timeframe and find the cut candle
  const ltfTrigger = find5mTriggerCandle(candles5m, htfResult.h14, htfResult.windowStart, htfResult.windowEnd);

  if (!ltfTrigger) {
    return {
      matched: false,
      status: "NO_5M_CUT_CANDLE",
      message: "No 5m candle pierced H14 within the 15m window",
      htf: htfResult,
      ltf: null,
      fvg: null,
    };
  }

  // 3. Check if the cut candle forms an FVG as the 3rd candle
  const fvgResult = checkCutCandleFVG(candles5m, ltfTrigger.cutIndex);

  const matched = htfResult.matched && Boolean(ltfTrigger) && fvgResult.exists;

  return {
    matched,
    status: matched ? "PATTERN_MATCHED" : "NO_FVG_ON_CUT_CANDLE",
    message: matched
      ? `15m sweep matched at ₹${htfResult.h14} and 5m cut candle formed a ${fvgResult.type} FVG (₹${fvgResult.bottom} - ₹${fvgResult.top})`
      : `15m sweep matched at ₹${htfResult.h14}, but 5m cut candle did not form an FVG as Candle 3`,
    htf: htfResult,
    ltf: ltfTrigger,
    fvg: fvgResult,
  };
}

