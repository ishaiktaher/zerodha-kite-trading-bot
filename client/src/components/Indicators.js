import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const Indicators = ({ symbol, accessToken }) => {
  const [rsi, setRsi] = useState(null);
  const [ema, setEma] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIndicators = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.post("strategy", {
          params: { symbol },
        });
        setRsi(res.data.rsi);
        setEma(res.data.ema);
      } catch (err) {
        console.error("Failed to fetch indicators", err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) fetchIndicators();
  }, [symbol, accessToken]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg w-full max-w-md mx-auto mt-8">
      <h3 className="text-2xl font-bold text-white text-center mb-6">
        Technical Indicators
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 border-solid"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rsi !== null ? (
            <div className="flex justify-between text-white">
              <span className="text-gray-300">RSI (14):</span>
              <span className="font-semibold">{rsi.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No RSI data available.</p>
          )}

          {ema !== null ? (
            <div className="flex justify-between text-white">
              <span className="text-gray-300">EMA (20):</span>
              <span className="font-semibold">{ema.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No EMA data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Indicators;
