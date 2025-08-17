import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { MasterAdminOnly } from '../../components/PermissionGuard';

const OrderHistoryTracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    branch: '',
    orderNumber: ''
  });

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
      case 'Sent to CK': return 'bg-purple-100 text-purple-800';
      case 'Shipped': return 'bg-yellow-100 text-yellow-800';
      case 'Received': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.branch && !order.section.toLowerCase().includes(filters.branch.toLowerCase())) return false;
    if (filters.orderNumber && !order.orderNo.includes(filters.orderNumber)) return false;
    if (filters.dateFrom && new Date(order.dateTime) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(order.dateTime) > new Date(filters.dateTo)) return false;
    return true;
  }) : [];

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const deleteHistory = async () => {
    if (!window.confirm('This will permanently delete all orders in the current view (excluding "Sent to CK" orders). Continue?')) return;
    try {
      setDeleting(true);
      const toDelete = (filteredOrders.length > 0 ? filteredOrders : orders).filter(order => order.status !== 'Sent to CK');
      await Promise.all(toDelete.map(o => apiService.orders.delete(o._id)));
      setOrders(prev => prev.filter(o => !toDelete.some(d => d._id === o._id)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete history');
    } finally {
      setDeleting(false);
    }
  };

  const deleteOne = async (id) => {
    const order = orders.find(o => o._id === id);
    if (order && order.status === 'Sent to CK') {
      alert('Cannot delete orders with "Sent to CK" status');
      return;
    }
    
    if (!window.confirm('Delete this order permanently?')) return;
    try {
      setDeletingId(id);
      await apiService.orders.delete(id);
      setOrders(prev => prev.filter(o => o._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete order');
    } finally {
      setDeletingId('');
    }
  };



  const handleViewOrder = (order) => {
    // For now, just show an alert with order details
    // In a real implementation, this could open a modal or navigate to a detail page
    alert(`Order Details:\nOrder No: ${order.orderNo}\nStatus: ${order.status}\nSection: ${order.section}\nItems: ${order.items?.length || 0} items`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History & Tracking</h1>
              <p className="text-gray-600">Monitor order status and track delivery progress</p>
            </div>
            <button onClick={deleteHistory} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">{deleting ? 'Deleting...' : 'Delete History (Clean)'}</button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Sent to CK">Sent to CK</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Received">Received</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="Search section..."
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                <input
                  type="text"
                  placeholder="Search order number..."
                  value={filters.orderNumber}
                  onChange={(e) => setFilters({...filters, orderNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order List</h2>
              <p className="text-sm text-gray-600 mt-1">Showing {filteredOrders.length} orders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          {order.status}
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
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         {order.status === 'Sent to CK' ? (
                           <button 
                             onClick={() => handleViewOrder(order)} 
                             className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700"
                           >
                             View
                           </button>
                         ) : (
                           <button onClick={() => deleteOne(order._id)} className={`px-3 py-1 rounded text-white ${deletingId === order._id ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`} disabled={!!deletingId && deletingId === order._id}>
                             {deletingId === order._id ? 'Deleting...' : 'Delete'}
                           </button>
                         )}
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
                onClick={() => setFilters({status: '', dateFrom: '', dateTo: '', branch: '', orderNumber: ''})}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </MasterAdminOnly>
  );
};

export default OrderHistoryTracking; 