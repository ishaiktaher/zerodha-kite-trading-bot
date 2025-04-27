const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken"); // Import middleware

router.get("/margins", verifyToken, async (req, res) => {
  const {segment = "equity"} = req.query;
  try {
  const response = await req.kite.getMargins(segment);
  res.json(response);
} catch (err) {
  res.status(500).json({ error: err.message });
}
});

module.exports = router;
