import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const FundsOverview = () => {
  const [funds, setFunds] = useState(null);
  const [segment, setSegment] = useState("equity")

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const res = await axiosInstance.get("/user/funds", {
          params: {segment },
        });
        setFunds(res.data || {});
      } catch (err) {
        console.error("Failed to fetch funds", err);
      }
    };

    fetchFunds();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Funds Overview</h2>
      {funds ? (
        <div className="bg-gray-800 p-6 rounded-2xl">
          <p className="mb-2">
            <span className="text-gray-400">Available Cash:</span> ₹{funds.available_cash}
          </p>
          <p className="mb-2">
            <span className="text-gray-400">Utilized Margin:</span> ₹{funds.utilized_margin}
          </p>
          <p>
            <span className="text-gray-400">Total Margin:</span> ₹{funds.total_margin}
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-center">Loading fund data...</p>
      )}
    </div>
  );
};

export default FundsOverview;
