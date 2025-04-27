import React, { useState, useEffect } from "react";
import OrderPanel from "./OrderPanel";
import StockSearch from "./StockSearch";
import Indicators from "./Indicators";
import { useLocation, useNavigate } from "react-router-dom";
import { useToken } from "../context/TokenContext";
import OrdersList from "./dashboard-tabs/OrdersList";
import PortfolioHoldings from "./dashboard-tabs/PortfolioHoldings";
import FundsOverview from "./dashboard-tabs/FundsOverview";
 
const Dashboard = () => {
  const [selectedStock, setSelectedStock] = useState("");
  const [activeTab, setActiveTab] = useState("trade"); // 👈 New tab state
  const location = useLocation();
  const navigate = useNavigate();
  const { setAccessToken, accessToken } = useToken();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      setAccessToken(token);
    } else {
      if (!accessToken) {
        navigate("/login");
      }
    }
  }, [location, navigate, accessToken, setAccessToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Algo Trading Dashboard</h1>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <button
          className={`px-6 py-2 rounded-t-lg ${
            activeTab === "trade" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("trade")}
        >
          Trade
        </button>
        <button
          className={`px-6 py-2 rounded-t-lg ${
            activeTab === "orders" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          My Orders
        </button>
        <button
          className={`px-6 py-2 rounded-t-lg ${
            activeTab === "portfolio" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("portfolio")}
        >
          Portfolio
        </button>
        <button
          className={`px-6 py-2 rounded-t-lg ${
            activeTab === "funds" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("funds")}
        >
          Funds
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        {activeTab === "trade" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Search & Track Stocks</h2>
                <StockSearch onSelect={setSelectedStock} />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Place Order</h2>
                <OrderPanel accessToken={accessToken} symbol={selectedStock} />
              </div>
            </div>

            {selectedStock && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  Indicators for {selectedStock}
                </h2>
                <Indicators symbol={selectedStock} />
              </div>
            )}
          </>
        )}

        {activeTab === "orders" && <OrdersList />}

        {activeTab === "portfolio" && <PortfolioHoldings />}

        {activeTab === "funds" && <FundsOverview />}
      </div>
    </div>
  );
};

export default Dashboard;
