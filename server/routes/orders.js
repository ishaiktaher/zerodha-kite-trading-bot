const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken"); // Import middleware

router.get("/", verifyToken, async (req, res) => {
  try {
    const response = await req.kite.getOrders();
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/place-order", verifyToken, async (req, res) => {
  const { symbol, action, quantity } = req.body;

  try {
    const orderId = await req.kite.placeOrder({
      exchange: "NSE",
      tradingsymbol: symbol,
      transaction_type: action === "BUY" ? "BUY" : "SELL",
      quantity: parseInt(quantity),
      product: "MIS",
      order_type: "MARKET",
    });
    res.json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/auto-trade", async (req, res) => {
  const { symbol } = req.body;
  const historicalData = await historicalData(symbol); // Fetch candles
  const { shouldBuy, shouldSell } = checkRSI_EMA(historicalData);

  if (shouldBuy) {
    await kite.placeOrder({ ...buyParams });
    res.json({ action: "BUY" });
  } else if (shouldSell) {
    await kite.placeOrder({ ...sellParams });
    res.json({ action: "SELL" });
  } else {
    res.json({ action: "NO_TRADE" });
  }
});

router.get("/holdings", verifyToken, async (req, res) => {
  try {
  const response = await req.kite.getHoldings();
  res.json(response);
} catch (err) {
  res.status(500).json({ error: err.message });
}
});

router.get("/positions", verifyToken, async (req, res) => {
  try {
  const response = await req.kite.getPositions();
  res.json(response);
} catch (err) {
  res.status(500).json({ error: err.message });
}
});

module.exports = router;
