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
        // Only show orders that are "Under Process" (Accepted) or "Rejected"
        const filteredOrders = response.data.filter(order => 
          order.status === 'Under Process' || order.status === 'Rejected'
        );
        setOrders(filteredOrders);
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
      console.log('Fetching branches...');
      const response = await apiService.branches.getAll();
      console.log('Branches response:', response);
      
      if (Array.isArray(response.data)) {
        setBranches(response.data);
        console.log('Branches set:', response.data.length);
      } else {
        console.log('Branches response is not an array:', response);
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

  // Separate orders by status
  const acceptedOrders = orders.filter(order => order.status === 'Under Process');
  const rejectedOrders = orders.filter(order => order.status === 'Rejected');

  // Filter orders based on search and other filters
  const filterOrders = (orderList) => {
    return orderList.filter(order => {
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
      if (filters.urgency && order.urgency !== filters.urgency) return false;
      
      if (filters.dateFrom || filters.dateTo) {
        const orderDate = new Date(order.dateTime);
        if (filters.dateFrom && orderDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && orderDate > new Date(filters.dateTo)) return false;
      }
      
      return true;
    });
  };

  const filteredAcceptedOrders = filterOrders(acceptedOrders);
  const filteredRejectedOrders = filterOrders(rejectedOrders);

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
      case 'Under Process':
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
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
      header: 'Order No',
      render: (item) => <span className="font-mono text-sm">{item?.orderNo || 'N/A'}</span>
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (item) => <span className="font-medium">{item?.branch || 'N/A'}</span>
    },
    {
      key: 'section',
      header: 'Section',
      render: (item) => <span className="text-gray-600">{item?.section || 'N/A'}</span>
    },
    {
      key: 'userName',
      header: 'Ordered By',
      render: (item) => <span className="text-gray-700">{item?.userName || 'N/A'}</span>
    },
    {
      key: 'dateTime',
      header: 'Order Date',
      render: (item) => <span className="text-sm text-gray-600">
        {item?.dateTime ? new Date(item.dateTime).toLocaleDateString() : 'N/A'}
      </span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const status = item?.status;
        if (!status) return <span className="text-gray-400">N/A</span>;
        
        // Display "Accepted" instead of "Under Process"
        const displayStatus = status === 'Under Process' ? 'Accepted' : status;
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {displayStatus}
          </span>
        );
      }
    }
  ];

  const getViewModeStats = () => {
    const stats = {
      all: orders.length,
      accepted: orders.filter(o => o.status === 'Under Process').length,
      rejected: orders.filter(o => o.status === 'Rejected').length
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
        <p className="text-gray-600">View accepted and rejected orders from Central Kitchen</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              {branches.map(branch => {
                const branchName = branch.name || branch.nameEn || branch.branchName || branch._id || 'Unknown';
                console.log('Branch option:', branch, 'Name:', branchName);
                return (
                  <option key={branch._id} value={branchName}>{branchName}</option>
                );
              })}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {branches.length} branches loaded
            </div>
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

      {/* Accepted Orders Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-green-800">
              Accepted Orders ({filteredAcceptedOrders.length})
            </h3>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
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
          data={filteredAcceptedOrders}
          columns={tableColumns}
          loading={loading}
          emptyMessage="No accepted orders found"
          onView={handleViewOrder}
        />
      </div>

      {/* Rejected Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-800">
              Rejected Orders ({filteredRejectedOrders.length})
            </h3>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
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
          data={filteredRejectedOrders}
          columns={tableColumns}
          loading={loading}
          emptyMessage="No rejected orders found"
          onView={handleViewOrder}
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
                  {selectedOrder.status === 'Under Process' ? 'Accepted' : selectedOrder.status}
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
            </div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
};

export default BranchOrdersHistory; 