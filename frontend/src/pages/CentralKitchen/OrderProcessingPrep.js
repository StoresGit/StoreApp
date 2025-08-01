import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const OrderProcessingPrep = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/orders');
      // Filter orders that are ready for processing
      const processingOrders = response.data.filter(order => 
        order.status === 'pending' || order.status === 'processing'
      );
      setOrders(processingOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async (orderId) => {
    try {
      await apiService.put(`/orders/${orderId}`, { status: 'processing' });
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await apiService.put(`/orders/${orderId}`, { status: 'ready' });
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error('Error completing order:', err);
      alert('Failed to complete order');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-orange-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Order Processing & Prep</h1>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No orders ready for processing</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.orderNo}</h3>
                    <p className="text-gray-600">Branch: {order.branch}</p>
                    <p className="text-gray-600">Section: {order.section}</p>
                    <p className="text-gray-600">Ordered by: {order.userName}</p>
                    <p className="text-gray-600">
                      Date: {new Date(order.dateTime).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'processing' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items && Array.isArray(order.items) && order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-gray-600">Code: {item.itemCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.orderQty} {item.unit}</p>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStartProcessing(order._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Start Processing
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleCompleteOrder(order._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderProcessingPrep; 