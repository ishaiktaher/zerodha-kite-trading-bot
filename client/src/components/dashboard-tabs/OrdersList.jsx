import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get("/orders");
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Your Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-400 text-center">No orders yet.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="bg-gray-800 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{order.tradingsymbol}</p>
                <p className="text-sm text-gray-400">
                  {order.transaction_type} - Qty: {order.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-400">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
