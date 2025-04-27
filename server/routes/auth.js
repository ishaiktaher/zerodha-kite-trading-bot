require("dotenv").config();
const express = require("express");
const router = express.Router();
const KiteConnect = require("kiteconnect").KiteConnect;
const jwt = require("jsonwebtoken");
const sessionStore = require("../services/sessionStore");
const API_KEY = process.env.KITE_API_KEY;
const API_SECRET = process.env.KITE_API_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;

const kite = new KiteConnect({ api_key: API_KEY });

// Redirect to Kite Login
router.get("/login", (req, res) => {
  res.redirect(kite.getLoginURL());
});

router.get("/callback", async (req, res) => {
  const { request_token } = req.query;
  console.log("Request Token:", request_token);

  try {
    const { access_token, public_token, user_id, ...otherParams } =
      await kite.generateSession(request_token, API_SECRET);
    console.log("Logged In User:", user_id, otherParams);

    // Save access_token in session store
    sessionStore.set(user_id, access_token);

    // Generate a JWT token containing user_id (not access token)
    const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "1h" });

    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  } catch (err) {
    console.error(JSON.stringify(err));
    const error = "Login failed. Please try again!";
    res.redirect(`http://localhost:3000/login?error=${error}`);
  }
});

module.exports = router;
