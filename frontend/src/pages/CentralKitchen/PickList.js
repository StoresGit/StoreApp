import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import ResponsiveTable from '../../components/ResponsiveTable';
import ResponsiveModal from '../../components/ResponsiveModal';

const PickList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickList, setPickList] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showPickListModal, setShowPickListModal] = useState(false);
  const [filters, setFilters] = useState({
    branch: '',
    section: '',
    dateFrom: '',
    dateTo: ''
  });
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    fetchSections();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/orders');
      if (Array.isArray(response.data)) {
        // Filter for orders that need pick lists (pending and processing)
        const filteredOrders = response.data.filter(order => 
          ['pending', 'processing'].includes(order.status)
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

  const fetchSections = async () => {
    try {
      const response = await apiService.get('/sections/active');
      if (Array.isArray(response.data)) {
        setSections(response.data);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setSections([]);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrderSelection = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const generatePickList = () => {
    if (selectedOrders.length === 0) {
      setError('Please select at least one order to generate pick list');
      return;
    }

    const selectedOrderData = orders.filter(order => selectedOrders.includes(order._id));
    
    // Group items by category and aggregate quantities
    const itemMap = new Map();
    
    selectedOrderData.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const key = `${item.itemCode}-${item.category}`;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.totalQty += parseFloat(item.orderQty) || 0;
            existing.orders.push({
              orderNo: order.orderNo,
              branch: order.branch,
              qty: parseFloat(item.orderQty) || 0
            });
          } else {
            itemMap.set(key, {
              itemCode: item.itemCode,
              itemName: item.itemName,
              category: item.category,
              unit: item.unit,
              totalQty: parseFloat(item.orderQty) || 0,
              orders: [{
                orderNo: order.orderNo,
                branch: order.branch,
                qty: parseFloat(item.orderQty) || 0
              }]
            });
          }
        });
      }
    });

    const pickListData = Array.from(itemMap.values()).sort((a, b) => 
      a.category.localeCompare(b.category) || a.itemName.localeCompare(b.itemName)
    );

    setPickList(pickListData);
    setShowPickListModal(true);
  };

  const filteredOrders = orders.filter(order => {
    if (filters.branch && order.branch !== filters.branch) return false;
    if (filters.section && order.section !== filters.section) return false;
    
    if (filters.dateFrom || filters.dateTo) {
      const orderDate = new Date(order.dateTime);
      if (filters.dateFrom && orderDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && orderDate > new Date(filters.dateTo)) return false;
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
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
      key: 'select',
      label: 'Select',
      render: (_, order) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(order._id)}
          onChange={(e) => handleOrderSelection(order._id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
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
      key: 'itemCount',
      label: 'Items',
      render: (_, order) => (
        <span className="text-sm text-gray-600">
          {order.items && Array.isArray(order.items) ? order.items.length : 0} items
        </span>
      )
    }
  ];

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick List</h1>
        <p className="text-gray-600">Generate pick lists for order preparation</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Orders</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selected Orders</p>
              <p className="text-2xl font-bold text-gray-900">{selectedOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.reduce((total, order) => 
                  total + (order.items && Array.isArray(order.items) ? order.items.length : 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section._id} value={section.name}>{section.name}</option>
              ))}
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
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h3>
            <div className="flex space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>
              <button
                onClick={generatePickList}
                disabled={selectedOrders.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Generate Pick List ({selectedOrders.length})
              </button>
            </div>
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
          emptyMessage="No orders available for pick list"
        />
      </div>

      {/* Pick List Modal */}
      <ResponsiveModal
        isOpen={showPickListModal}
        onClose={() => setShowPickListModal(false)}
        title="Pick List"
        size="xl"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
              <p className="text-sm text-gray-600">Orders: {selectedOrders.length}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Print Pick List
            </button>
          </div>

          <div className="space-y-4">
            {pickList.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{item.itemName}</h4>
                    <p className="text-sm text-gray-600">Code: {item.itemCode}</p>
                    <p className="text-sm text-gray-600">Category: {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{item.totalQty}</p>
                    <p className="text-sm text-gray-600">{item.unit}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <h5 className="font-medium text-sm mb-2">Required by Orders:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {item.orders.map((order, orderIndex) => (
                      <div key={orderIndex} className="flex justify-between text-sm">
                        <span className="font-mono">{order.orderNo}</span>
                        <span className="text-gray-600">({order.branch})</span>
                        <span className="font-medium">{order.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowPickListModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default PickList; 