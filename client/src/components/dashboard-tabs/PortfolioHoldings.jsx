import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const PortfolioHoldings = ({ accessToken }) => {
  const [viewType, setViewType] = useState("holdings"); // 'holdings' or 'positions'
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint =
          viewType === "holdings"
            ? "/orders/holdings"
            : "/orders/positions";
        const res = await axiosInstance.get(endpoint, {
          params: { access_token: accessToken },
        });
        if (viewType === "holdings") {
          setData(res.data.holdings || []);
        } else {
          setData(res.data.positions || []);
        }
      } catch (err) {
        console.error(`Failed to fetch ${viewType}`, err);
      }
    };

    fetchData();
  }, [accessToken, viewType]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Your {viewType === "holdings" ? "Holdings" : "Positions"}
      </h2>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setViewType("holdings")}
          className={`px-4 py-2 rounded-lg ${
            viewType === "holdings"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          } transition`}
        >
          Holdings
        </button>
        <button
          onClick={() => setViewType("positions")}
          className={`px-4 py-2 rounded-lg ${
            viewType === "positions"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          } transition`}
        >
          Positions
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-400 text-center">No {viewType} available.</p>
      ) : (
        <div className="grid gap-4">
          {data.map((item, index) => (
            <div
              key={item.symbol || index}
              className="bg-gray-800 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.symbol}</p>
                <p className="text-sm text-gray-400">
                  Qty: {item.quantity}{" "}
                  {viewType === "holdings"
                    ? `| Avg Buy: ₹${item.average_price}`
                    : `| P&L: ₹${item.unrealised_profit}`}
                </p>
              </div>
              <div className="text-right">
                {viewType === "holdings" ? (
                  <p className="text-green-400">LTP: ₹{item.last_price}</p>
                ) : (
                  <p
                    className={
                      item.unrealised_profit >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {item.unrealised_profit >= 0 ? "+" : ""}
                    ₹{item.unrealised_profit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioHoldings;
