import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import ResponsiveTable from '../../components/ResponsiveTable';
import ResponsiveModal from '../../components/ResponsiveModal';

const BranchOrdersHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    urgency: '',
    searchTerm: ''
  });
  const [branches, setBranches] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // all, pending, processing, completed

  useEffect(() => {
    fetchOrders();
    fetchBranches();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/orders');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiService.get('/branches');
      if (Array.isArray(response.data)) {
        setBranches(response.data);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setBranches([]);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const filteredOrders = orders.filter(order => {
    // View mode filtering
    if (viewMode === 'pending' && order.status !== 'pending') return false;
    if (viewMode === 'processing' && order.status !== 'processing') return false;
    if (viewMode === 'completed' && !['ready', 'shipped', 'received'].includes(order.status)) return false;
    
    // Search term filtering
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        order.orderNo?.toLowerCase().includes(searchLower) ||
        order.branch?.toLowerCase().includes(searchLower) ||
        order.section?.toLowerCase().includes(searchLower) ||
        order.userName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Other filters
    if (filters.branch && order.branch !== filters.branch) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.urgency && order.urgency !== filters.urgency) return false;
    
    if (filters.dateFrom || filters.dateTo) {
      const orderDate = new Date(order.dateTime);
      if (filters.dateFrom && orderDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && orderDate > new Date(filters.dateTo)) return false;
    }
    
    return true;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiService.put(`/orders/${orderId}`, { status: newStatus });
      fetchOrders(); // Refresh the list
      setShowOrderModal(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tableColumns = [
    {
      key: 'orderNo',
      label: 'Order No',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'section',
      label: 'Section',
      render: (value) => <span className="text-gray-600">{value}</span>
    },
    {
      key: 'userName',
      label: 'Ordered By',
      render: (value) => <span className="text-gray-700">{value}</span>
    },
    {
      key: 'dateTime',
      label: 'Order Date',
      render: (value) => <span className="text-sm text-gray-600">
        {new Date(value).toLocaleDateString()}
      </span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'urgency',
      label: 'Urgency',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewOrder(order)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            View
          </button>
          {order.status === 'pending' && (
            <button
              onClick={() => handleUpdateStatus(order._id, 'processing')}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              Start
            </button>
          )}
        </div>
      )
    }
  ];

  const getViewModeStats = () => {
    const stats = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => ['ready', 'shipped', 'received'].includes(o.status)).length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const stats = getViewModeStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Orders & History</h1>
        <p className="text-gray-600">View and manage all branch orders with detailed history</p>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Orders', count: stats.all },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'processing', label: 'Processing', count: stats.processing },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleViewModeChange(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  viewMode === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by order no, branch, section, or user..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Urgency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h3>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <ResponsiveTable
          data={filteredOrders}
          columns={tableColumns}
          loading={loading}
          emptyMessage="No orders found"
        />
      </div>

      {/* Order Detail Modal */}
      <ResponsiveModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order No</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.orderNo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.branch}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.section}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ordered By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedOrder.dateTime).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Urgency</label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(selectedOrder.urgency)}`}>
                  {selectedOrder.urgency?.charAt(0).toUpperCase() + selectedOrder.urgency?.slice(1) || 'Not Set'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Time</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedOrder.scheduleOrderTime ? new Date(selectedOrder.scheduleOrderTime).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">Code: {item.itemCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.orderQty} {item.unit}</p>
                        <p className="text-xs text-gray-600">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Start Processing
                </button>
              )}
              {selectedOrder.status === 'processing' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'ready')}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Mark as Ready
                </button>
              )}
            </div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
};

export default BranchOrdersHistory; 