import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CentralKitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingOrders, setProcessingOrders] = useState(new Set());

  // Order statistics
  const [orderStats, setOrderStats] = useState({
    received: 0,
    accepted: 0,
    rejected: 0,
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
      
      // Filter orders for Central Kitchen (status: 'Sent to Central Kitchen', 'Under Process', 'Shipped', 'Rejected')
      const ckOrders = allOrders.filter(order => 
        ['Sent to Central Kitchen', 'Under Process', 'Shipped', 'Rejected'].includes(order.status)
      );
      
      setOrders(ckOrders);
      
      // Calculate statistics
      const stats = {
        received: ckOrders.filter(order => order.status === 'Sent to Central Kitchen').length,
        accepted: ckOrders.filter(order => order.status === 'Under Process').length,
        rejected: ckOrders.filter(order => order.status === 'Rejected').length,
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
      console.log('=== ACCEPTING ORDER ===');
      console.log('Order ID:', orderId);
      
      setProcessingOrders(prev => new Set(prev).add(orderId));
      setError('');
      setSuccess('');
      
      const response = await apiService.orders.update(orderId, { status: 'Under Process' });
      console.log('Accept response:', response);
      
      await fetchOrders(); // Refresh data
      console.log('Order accepted successfully');
      
      setSuccess('Order accepted successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Error accepting order:', err);
      setError('Failed to accept order');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      console.log('=== REJECTING ORDER ===');
      console.log('Order ID:', orderId);
      
      setProcessingOrders(prev => new Set(prev).add(orderId));
      setError('');
      setSuccess('');
      
      const response = await apiService.orders.update(orderId, { status: 'Rejected' });
      console.log('Reject response:', response);
      
      await fetchOrders(); // Refresh data
      console.log('Order rejected successfully');
      
      setSuccess('Order rejected successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Error rejecting order:', err);
      setError('Failed to reject order');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getRecentOrders = () => {
    return orders
      .filter(order => order.status === 'Sent to Central Kitchen')
      .slice(0, 10)
      .sort((a, b) => new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent to Central Kitchen':
        return 'bg-blue-100 text-blue-800';
      case 'Under Process':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItemsSummary = (order) => {
    const names = Array.isArray(order.items) ? order.items.map(i => i.itemName).filter(Boolean) : [];
    const preview = names.slice(0, 2).join(', ');
    const more = names.length > 2 ? ` +${names.length - 2} more` : '';
    return `${names.length} item${names.length !== 1 ? 's' : ''}${names.length ? ` (${preview}${more})` : ''}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Central Kitchen Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-white">Central Kitchen Dashboard</h1>
          <p className="text-blue-100 mt-1">Manage and process branch orders efficiently</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg border border-blue-200">
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

          <div className="bg-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Accepted</p>
                <p className="text-2xl font-bold text-green-900">{orderStats.accepted}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-100 p-6 rounded-lg border border-red-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{orderStats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Orders Shipped</p>
                <p className="text-2xl font-bold text-purple-900">{orderStats.shipped}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Pending Approval */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders Pending Approval</h2>
          {getRecentOrders().length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No orders pending approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getRecentOrders().map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.branchName || order.branch || order.branchNameEn || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.section || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderItemsSummary(order)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            disabled={processingOrders.has(order._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {processingOrders.has(order._id) ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order._id)}
                            disabled={processingOrders.has(order._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {processingOrders.has(order._id) ? 'Processing...' : 'Reject'}
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
      </div>
    </div>
  );
};

export default CentralKitchenDashboard; 