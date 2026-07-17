// server/routes/strategy.js
const express = require("express");
const router = express.Router();
const { evaluateLiquidityGrab } = require("../services/algoStrategy");
const { getHistoricalData } = require("../services/dataService");
const verifyToken = require("../middlewares/verifyToken");

router.post("/", verifyToken, async (req, res) => {
  const symbol = req.body?.params?.symbol;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "A stock symbol is required" });
  }

  try {
    const historicalData = await getHistoricalData(symbol, req.kite);
    const result = evaluateLiquidityGrab(historicalData);

    res.json({ symbol: symbol.trim().toUpperCase(), ...result });
  } catch (err) {
    console.error("Strategy evaluation failed:", err);
    res.status(err.statusCode || 500).json({
      error: err.statusCode ? err.message : "Strategy evaluation failed",
    });
  }
});

module.exports = router;
