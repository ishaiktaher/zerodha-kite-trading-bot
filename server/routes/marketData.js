const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");

router.get("/live", verifyToken, async (req, res) => {
  const { symbol } = req.query;

  try {
    console.log("Querying live data for ", symbol);
    const data = await req.kite.getQuote([`NSE:${symbol}`]);
    res.json(data[`NSE:${symbol}`]);
  } catch (err) {
    console.error("Failed to fetch live data:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

module.exports = router;
