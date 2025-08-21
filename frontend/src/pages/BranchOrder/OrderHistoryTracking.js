import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { MasterAdminOnly } from '../../components/PermissionGuard';

const OrderHistoryTracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      case 'Sent to Central Kitchen': return 'bg-purple-100 text-purple-800';
      case 'Under Process': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-yellow-100 text-yellow-800';
      case 'Received': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'Under Process': return 'Accepted from Central Kitchen';
      default: return status;
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.branch && !order.section.toLowerCase().includes(filters.branch.toLowerCase())) return false;
    if (filters.searchTerm && !order.orderNo.includes(filters.searchTerm)) return false;
    if (filters.dateFrom && new Date(order.dateTime) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(order.dateTime) > new Date(filters.dateTo)) return false;
    return true;
  }) : [];

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center">
                    <svg className="w-10 h-10 mr-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Order History & Tracking
                  </h1>
                  <p className="text-blue-100 text-lg">Monitor order status and track delivery progress</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L9.414 9H17a1 1 0 110 2H9.414l2.293 2.293A1 1 0 0112 15H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
              </svg>
              Filters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 font-medium"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Sent to Central Kitchen">Sent to Central Kitchen</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Received">Received</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                <input
                  type="text"
                  placeholder="Search section..."
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order Number</label>
                <input
                  type="text"
                  placeholder="Search order number..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Order List
              </h2>
              <p className="text-blue-100 mt-2">Showing {filteredOrders.length} orders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.orderNo}</div>
                          <div className="text-sm text-gray-500">ID: {order._id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.section}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusDisplayText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Order: {formatDate(order.dateTime)}</div>
                          {order.scheduleDate && (
                            <div className="text-gray-500">Schedule: {formatDate(order.scheduleDate)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{Array.isArray(order.items) ? order.items.length : 0} items</div>
                        <div className="text-sm text-gray-500">
                          {Array.isArray(order.items) && order.items.slice(0, 2).map(item => item.itemName).join(', ')}
                          {Array.isArray(order.items) && order.items.length > 2 && '...'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No orders found matching your criteria</div>
              <button 
                onClick={() => setFilters({status: '', dateFrom: '', dateTo: '', branch: '', searchTerm: ''})}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Order Number:</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.orderNo}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Status:</p>
                <p className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusDisplayText(selectedOrder.status)}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Section:</p>
                <p className="text-lg text-gray-900">{selectedOrder.section}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Order Date:</p>
                <p className="text-lg text-gray-900">{formatDate(selectedOrder.dateTime)}</p>
              </div>
              {selectedOrder.scheduleDate && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Schedule Date:</p>
                  <p className="text-lg text-gray-900">{formatDate(selectedOrder.scheduleDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700">Total Items:</p>
                <p className="text-lg text-gray-900">{Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Items:</p>
                <ul className="list-disc list-inside text-gray-800 text-lg">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => (
                    <li key={index}>{item.itemName} ({item.quantity})</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MasterAdminOnly>
  );
};

export default OrderHistoryTracking; 