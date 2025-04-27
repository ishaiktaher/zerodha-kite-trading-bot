require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const marketDataRoutes = require("./routes/marketData");
const instrumentsRoutes = require("./routes/instruments");
const strategyRoutes = require("./routes/strategy");
const userRoutes = require("./routes/user");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/market", marketDataRoutes);
app.use("/instruments", instrumentsRoutes);
app.use("/strategy", strategyRoutes);
app.use("/user", strategyRoutes);

// Start cron jobs
require("./services/cronJobs");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
