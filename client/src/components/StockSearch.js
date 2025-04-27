import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const StockSearch = ({ accessToken, onSelect }) => {
  const [symbol, setSymbol] = useState("INFY");
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false); // 👈 New loading state

  useEffect(() => {
    if (!accessToken) return;

    const fetchLiveData = async () => {
      try {
        setLoading(true); // 👈 Start loading
        const response = await axiosInstance.get(
          "http://localhost:4000/market/live",
          {
            params: { symbol },
          }
        );
        setLiveData(response.data);
      } catch (err) {
        console.error("Failed to fetch live data", err);
      } finally {
        setLoading(false); // 👈 Stop loading
      }
    };

    const interval = setInterval(fetchLiveData, 2000);
    fetchLiveData();
    return () => clearInterval(interval);
  }, [accessToken, symbol]);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(symbol);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Enter Stock Symbol (e.g. INFY)"
        className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
        </div>
      ) : liveData ? (
        <div className="text-center text-white">
          <p className="text-lg">
            <span className="font-semibold">LTP:</span> ₹{liveData.last_price}
          </p>
          <p className="text-gray-300 text-sm">({symbol})</p>
        </div>
      ) : (
        <p className="text-gray-400 text-center">No data yet...</p>
      )}

      <button
        onClick={handleSelect}
        className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Track {symbol}</span>
      </button>
    </div>
  );
};

export default StockSearch;
