import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CentralKitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Order statistics
  const [orderStats, setOrderStats] = useState({
    received: 0,
    underProcess: 0,
    shipped: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      const allOrders = response.data || [];
      
      // Filter orders for Central Kitchen (status: 'Sent to CK', 'Under Process', 'Shipped')
      const ckOrders = allOrders.filter(order => 
        ['Sent to CK', 'Under Process', 'Shipped'].includes(order.status)
      );
      
      setOrders(ckOrders);
      
      // Calculate statistics
      const stats = {
        received: ckOrders.filter(order => order.status === 'Sent to CK').length,
        underProcess: ckOrders.filter(order => order.status === 'Under Process').length,
        shipped: ckOrders.filter(order => order.status === 'Shipped').length
      };
      
      setOrderStats(stats);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await apiService.orders.update(orderId, { status: 'Under Process' });
      fetchOrders(); // Refresh data
    } catch (err) {
      setError('Failed to accept order');
      console.error('Error accepting order:', err);
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await apiService.orders.update(orderId, { status: 'Rejected' });
      fetchOrders(); // Refresh data
    } catch (err) {
      setError('Failed to reject order');
      console.error('Error rejecting order:', err);
    }
  };

  const getRecentOrders = () => {
    return orders
      .filter(order => order.status === 'Sent to CK')
      .slice(0, 5)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading Central Kitchen Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Central Kitchen Dashboard</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Orders Received</p>
                <p className="text-2xl font-bold text-blue-900">{orderStats.received}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-100 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Under Process</p>
                <p className="text-2xl font-bold text-yellow-900">{orderStats.underProcess}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-100 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Orders Shipped</p>
                <p className="text-2xl font-bold text-green-900">{orderStats.shipped}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Pending Approval */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders Pending Approval</h2>
          {getRecentOrders().length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No orders pending approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getRecentOrders().map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.branch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/central-kitchen/picklist'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Picklist
              </button>
              <button
                onClick={() => window.location.href = '/central-kitchen/order-processing'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Order Processing & Prep
              </button>
              <button
                onClick={() => window.location.href = '/central-kitchen/branch-orders-history'}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Branch Orders History
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders Today:</span>
                <span className="font-medium">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Approval:</span>
                <span className="font-medium">{orderStats.received}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Production:</span>
                <span className="font-medium">{orderStats.underProcess}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Today:</span>
                <span className="font-medium">{orderStats.shipped}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentralKitchenDashboard; 