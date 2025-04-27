async function getHistoricalData(symbol, kite) {
  //kite.setAccessToken(accessToken);

  // Example: Fetch last 20 days of data
  const today = new Date();
  const fromDate = new Date();
  fromDate.setDate(today.getDate() - 20);

  const data = await kite.getHistoricalData(
    `NSE:${symbol}`,
    "day",
    fromDate,
    today,
    "regular"
  );
  console.log("data", data);
  return data.map((item) => item.close); // Return array of closing prices
}
module.exports = getHistoricalData;
