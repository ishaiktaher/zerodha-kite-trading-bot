// server/middleware/verifyToken.js
const jwt = require("jsonwebtoken");
const { KiteConnect } = require("kiteconnect");
const API_KEY = process.env.KITE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const sessionStore = require("../services/sessionStore");

const verifyToken = (req, res, next) => {
  // 1. Get token from headers
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(403).json({ error: "Token missing!" });
  }

  // 2. Verify JWT token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token!" });
    }

    // 3. Attach the access token to KiteConnect instance
    const kite = new KiteConnect({ api_key: API_KEY });
    const access_token = sessionStore.get(decoded.user_id);
    kite.setAccessToken(access_token);

    // 4. Attach kite instance to request for further use
    req.kite = kite;

    // Move to the next middleware
    next();
  });
};

module.exports = verifyToken;
