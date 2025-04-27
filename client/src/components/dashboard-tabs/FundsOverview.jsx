import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

const FundsOverview = () => {
  const [funds, setFunds] = useState(null);
  const [segment, setSegment] = useState("equity");

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const res = await axiosInstance.get("/user/margins", {
          params: { segment },
        });
        setFunds(res.data || {});
      } catch (err) {
        console.error("Failed to fetch funds", err);
      }
    };

    fetchFunds();
  }, [segment]); // refetch when segment changes

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg space-y-6">
      <h2 className="text-xl font-semibold text-center">Funds Overview</h2>

      {/* Segment Switcher */}
      <div className="flex justify-center space-x-4">
        {["equity", "commodity"].map((seg) => (
          <button
            key={seg}
            onClick={() => setSegment(seg)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              segment === seg
                ? "bg-amber-500 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {seg.charAt(0).toUpperCase() + seg.slice(1)}
          </button>
        ))}
      </div>

      {/* Funds Data */}
      {funds ? (
        <div className="space-y-2 text-center">
          <p className="text-lg text-green-400">
            Available Margin: ₹{funds.available?.cash ?? "0"}
          </p>
          <p className="text-lg text-red-400">
            Utilized Margin: ₹{funds.utilised?.debits ?? "0"}
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-center">Loading funds...</p>
      )}
    </div>
  );
};

export default FundsOverview;
