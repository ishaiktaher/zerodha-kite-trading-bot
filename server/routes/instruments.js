const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const verifyToken = require("../middlewares/verifyToken");

router.get("/", verifyToken, (req, res) => {
  try {
    const instruments = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../instruments.csv"))
    );
    res.json(instruments);
  } catch (err) {
    res.status(500).json({ error: "Failed to load instruments" });
  }
});

module.exports = router;
