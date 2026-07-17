import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const CONDITION_LABELS = {
  firstPreviousCandleRed: "Two days ago candle is red",
  previousCandleRed: "Previous day candle is red",
  presentCandleGreen: "Present day candle is green",
  previousCandleRSIBelowThreshold: "Previous day RSI(14) is below 50",
};

const Indicators = ({ symbol }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStrategy = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.post("strategy", {
          params: { symbol },
        });
        setResult(response.data);
      } catch (requestError) {
        setResult(null);
        setError(requestError.response?.data?.error || "Failed to evaluate strategy");
      } finally {
        setLoading(false);
      }
    };

    if (symbol) fetchStrategy();
  }, [symbol]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg w-full max-w-xl mx-auto mt-8">
      <h3 className="text-2xl font-bold text-white text-center mb-2">
        Liquidity Grab Pattern
      </h3>
      <p className="text-gray-400 text-sm text-center mb-6">
        Daily candle evaluation; the present-day candle is provisional until market close.
      </p>

      {loading && <p className="text-blue-300 text-center">Evaluating {symbol}…</p>}
      {error && <p className="text-red-300 text-center">{error}</p>}

      {!loading && result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg p-4 text-center font-bold ${
              result.matched ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
            }`}
          >
            {result.matched ? "Pattern matched" : "Pattern not matched"}
          </div>

          <div className="flex justify-between text-white border-b border-white/10 pb-3">
            <span className="text-gray-300">Previous day RSI ({result.rsiPeriod})</span>
            <span className="font-semibold">{result.previousCandleRSI.toFixed(2)}</span>
          </div>

          {Object.entries(result.conditions).map(([condition, passed]) => (
            <div key={condition} className="flex justify-between gap-4 text-white">
              <span className="text-gray-300">{CONDITION_LABELS[condition]}</span>
              <span className={passed ? "text-green-300" : "text-red-300"}>
                {passed ? "Pass" : "Fail"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Indicators;
