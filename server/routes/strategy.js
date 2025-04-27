// server/routes/strategy.js
const express = require("express");
const router = express.Router();
const { evaluateTrade } = require("../services/algoStrategy");
const getHistoricalData = require("../services/dataService");
const verifyToken = require("../middlewares/verifyToken");

router.post("/", verifyToken, async (req, res) => {
  const { symbol } = req.body.params;

  try {
    // Fetch historical data (example - implement your own data fetching)
    const historicalData = await getHistoricalData(symbol, req.kite);

    // Evaluate strategy
    const result = evaluateTrade(historicalData);

    res.json({
      rsi: result.rsi,
      ema: result.ema,
      shouldBuy: result.shouldBuy,
      shouldSell: result.shouldSell,
    });
  } catch (err) {
    res.status(500).json({ error: "Strategy evaluation failed" });
  }
});

module.exports = router;
