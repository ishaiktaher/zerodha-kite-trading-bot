import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const OrderPanel = ({ accessToken, symbol }) => {
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState("BUY");

  const placeOrder = async () => {
    if (!symbol) {
      alert("Please select a stock first!");
      return;
    }
    try {
      const res = await axiosInstance.post(
        "http://localhost:4000/orders/place-order",
        {
          symbol,
          action,
          quantity,
        }
      );
      alert(`Order placed! ID: ${res.data.orderId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to place order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-gray-300">Symbol</label>
        <input
          className="bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={symbol}
          disabled
          placeholder="Selected stock will appear here"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-300">Quantity</label>
        <input
          type="number"
          min={1}
          className="bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-300">Action</label>
        <select
          className="bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      <button
        onClick={placeOrder}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-4 transition duration-200"
      >
        Place Order
      </button>
    </div>
  );
};

export default OrderPanel;
