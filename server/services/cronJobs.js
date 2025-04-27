const cron = require("node-cron");
const KiteConnect = require("kiteconnect").KiteConnect;
const fs = require("fs");
const path = require("path");

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

const updateInstruments = async () => {
  try {
    const instruments = await kite.getInstruments();
    const filePath = path.join(__dirname, "../instruments.csv");
    fs.writeFileSync(filePath, JSON.stringify(instruments));
    console.log("Instruments updated at", new Date().toISOString());
  } catch (err) {
    console.error("Failed to update instruments:", err);
  }
};

// Run every Monday and Thursday at 6 AM
cron.schedule("0 6 * * 1,4", updateInstruments);

// Initial run
updateInstruments();
