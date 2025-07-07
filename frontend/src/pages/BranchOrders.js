import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const BranchOrders = () => {
  const [activeTab, setActiveTab] = useState('create-orders');
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Create Orders State
  const [orderItems, setOrderItems] = useState([]);
  const [newOrderItem, setNewOrderItem] = useState({
    item: '',
    quantity: '',
    notes: ''
  });
  
  // Order History State
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Order Fulfilment State
  const [pendingOrders, setPendingOrders] = useState([]);
  
  // Stock Count State
  const [stockFilters, setStockFilters] = useState({
    branch: '',
    item: ''
  });
  
  // Settings State
  const [settings, setSettings] = useState({
    autoApprovalLimit: '',
    orderDeadline: '',
    defaultBranch: '',
    notifications: true
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [branchesRes, itemsRes, ordersRes] = await Promise.all([
        axios.get(`${backend_url}/branch`),
        axios.get(`${backend_url}/items`),
        axios.get(`${backend_url}/orders`)
      ]);
      
      setBranches(branchesRes.data || []);
      setItems(itemsRes.data || []);
      setOrders(ordersRes.data || []);
      setOrderHistory(ordersRes.data || []);
      setPendingOrders(ordersRes.data?.filter(order => order.status === 'pending') || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tab Navigation Component
  const TabNavigation = () => {
    const tabs = [
      { id: 'create-orders', label: 'Create Orders', icon: '📝' },
      { id: 'submit-order', label: 'Submit Order', icon: '📤' },
      { id: 'order-history', label: 'Order History', icon: '📋' },
      { id: 'order-fulfilment', label: 'Order Fulfilment', icon: '✅' },
      { id: 'stock-count', label: 'Stock Count', icon: '📊' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#735dff] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  // Create Orders Component
  const CreateOrders = () => {
    const addOrderItem = () => {
      if (newOrderItem.item && newOrderItem.quantity) {
        const item = items.find(i => i._id === newOrderItem.item);
        setOrderItems([...orderItems, {
          ...newOrderItem,
          itemName: item?.nameEn || item?.name || 'Unknown Item',
          id: Date.now()
        }]);
        setNewOrderItem({ item: '', quantity: '', notes: '' });
      } else {
        alert('Please select an item and enter quantity');
      }
    };

    const removeOrderItem = (id) => {
      setOrderItems(orderItems.filter(item => item.id !== id));
    };

    const createOrder = async () => {
      if (!selectedBranch || orderItems.length === 0) {
        alert('Please select a branch and add at least one item');
        return;
      }

      try {
        const orderData = {
          branch: selectedBranch,
          items: orderItems.map(item => ({
            item: item.item,
            quantity: parseInt(item.quantity),
            notes: item.notes
          })),
          status: 'draft',
          createdAt: new Date()
        };

        await axios.post(`${backend_url}/orders`, orderData);
        setOrderItems([]);
        setSelectedBranch('');
        alert('Order created successfully!');
        fetchInitialData();
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Error creating order');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select a branch...</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-3">Add Items</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <select
                value={newOrderItem.item}
                onChange={(e) => setNewOrderItem({...newOrderItem, item: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select item...</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.nameEn || item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={newOrderItem.quantity}
                onChange={(e) => setNewOrderItem({...newOrderItem, quantity: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newOrderItem.notes}
                onChange={(e) => setNewOrderItem({...newOrderItem, notes: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={addOrderItem}
                className="bg-[#735dff] text-white px-4 py-2 rounded-md hover:bg-[#5a47d6]"
              >
                Add Item
              </button>
            </div>
          </div>

          {orderItems.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Order Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-4 border-b text-left">Item</th>
                      <th className="py-2 px-4 border-b text-left">Quantity</th>
                      <th className="py-2 px-4 border-b text-left">Notes</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-2 px-4 border-b">{item.itemName}</td>
                        <td className="py-2 px-4 border-b">{item.quantity}</td>
                        <td className="py-2 px-4 border-b">{item.notes || '-'}</td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => removeOrderItem(item.id)}
                            className="text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={createOrder}
                  className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
                >
                  Create Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Submit Order Component
  const SubmitOrder = () => {
    const draftOrders = orders.filter(order => order.status === 'draft');

    const submitOrder = async (orderId) => {
      try {
        await axios.put(`${backend_url}/orders/${orderId}`, { status: 'submitted' });
        alert('Order submitted successfully!');
        fetchInitialData();
      } catch (error) {
        console.error('Error submitting order:', error);
        alert('Error submitting order');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Submit Orders</h3>
          
          {draftOrders.length === 0 ? (
            <p className="text-gray-500">No draft orders available to submit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border-b text-left">Order ID</th>
                    <th className="py-2 px-4 border-b text-left">Branch</th>
                    <th className="py-2 px-4 border-b text-left">Items Count</th>
                    <th className="py-2 px-4 border-b text-left">Created</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftOrders.map(order => (
                    <tr key={order._id}>
                      <td className="py-2 px-4 border-b">#{order._id?.slice(-6)}</td>
                      <td className="py-2 px-4 border-b">{order.branch?.name || 'Unknown'}</td>
                      <td className="py-2 px-4 border-b">{order.items?.length || 0}</td>
                      <td className="py-2 px-4 border-b">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => submitOrder(order._id)}
                          className="bg-[#735dff] text-white px-4 py-1 rounded hover:bg-[#5a47d6]"
                        >
                          Submit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Order History Component
  const OrderHistory = () => {
    const filteredHistory = useMemo(() => {
      let filtered = orderHistory;
      
      if (historyFilters.branch) {
        filtered = filtered.filter(order => order.branch?._id === historyFilters.branch);
      }
      if (historyFilters.status) {
        filtered = filtered.filter(order => order.status === historyFilters.status);
      }
      if (historyFilters.dateFrom) {
        filtered = filtered.filter(order => 
          new Date(order.createdAt) >= new Date(historyFilters.dateFrom)
        );
      }
      if (historyFilters.dateTo) {
        filtered = filtered.filter(order => 
          new Date(order.createdAt) <= new Date(historyFilters.dateTo)
        );
      }
      
      return filtered;
    }, [historyFilters.branch, historyFilters.status, historyFilters.dateFrom, historyFilters.dateTo, orderHistory]);

    const getStatusColor = (status) => {
      switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'submitted': return 'bg-blue-100 text-blue-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'fulfilled': return 'bg-purple-100 text-purple-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order History</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select
              value={historyFilters.branch}
              onChange={(e) => setHistoryFilters({...historyFilters, branch: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              value={historyFilters.status}
              onChange={(e) => setHistoryFilters({...historyFilters, status: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={historyFilters.dateFrom}
              onChange={(e) => setHistoryFilters({...historyFilters, dateFrom: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="date"
              value={historyFilters.dateTo}
              onChange={(e) => setHistoryFilters({...historyFilters, dateTo: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left">Order ID</th>
                  <th className="py-2 px-4 border-b text-left">Branch</th>
                  <th className="py-2 px-4 border-b text-left">Items</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Created</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(order => (
                  <tr key={order._id}>
                    <td className="py-2 px-4 border-b">#{order._id?.slice(-6)}</td>
                    <td className="py-2 px-4 border-b">{order.branch?.name || 'Unknown'}</td>
                    <td className="py-2 px-4 border-b">{order.items?.length || 0}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button className="text-[#735dff] hover:underline">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Order Fulfilment Component
  const OrderFulfilment = () => {
    const fulfillOrder = async (orderId) => {
      try {
        await axios.put(`${backend_url}/orders/${orderId}`, { status: 'fulfilled' });
        alert('Order fulfilled successfully!');
        fetchInitialData();
      } catch (error) {
        console.error('Error fulfilling order:', error);
        alert('Error fulfilling order');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Fulfilment</h3>
          
          {pendingOrders.length === 0 ? (
            <p className="text-gray-500">No pending orders to fulfill.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border-b text-left">Order ID</th>
                    <th className="py-2 px-4 border-b text-left">Branch</th>
                    <th className="py-2 px-4 border-b text-left">Items</th>
                    <th className="py-2 px-4 border-b text-left">Priority</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map(order => (
                    <tr key={order._id}>
                      <td className="py-2 px-4 border-b">#{order._id?.slice(-6)}</td>
                      <td className="py-2 px-4 border-b">{order.branch?.name || 'Unknown'}</td>
                      <td className="py-2 px-4 border-b">{order.items?.length || 0}</td>
                      <td className="py-2 px-4 border-b">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          NORMAL
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b space-x-2">
                        <button
                          onClick={() => fulfillOrder(order._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Fulfill
                        </button>
                        <button className="text-[#735dff] hover:underline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Stock Count Component
  const StockCount = () => {
    const stockData = useMemo(() => {
      // Mock stock data - in real app, this would come from backend
      if (items.length > 0) {
        return items.map(item => ({
          _id: item._id,
          name: item.nameEn || item.name,
          currentStock: Math.floor(Math.random() * 100),
          minStock: Math.floor(Math.random() * 20),
          maxStock: Math.floor(Math.random() * 150) + 100,
          lastUpdated: new Date()
        }));
      }
      return [];
    }, [items]);

    const getStockStatus = (current, min, max) => {
      if (current <= min) return { status: 'Low', color: 'bg-red-100 text-red-800' };
      if (current >= max) return { status: 'High', color: 'bg-blue-100 text-blue-800' };
      return { status: 'Normal', color: 'bg-green-100 text-green-800' };
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Stock Count</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <select
              value={stockFilters.branch}
              onChange={(e) => setStockFilters({...stockFilters, branch: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search items..."
              value={stockFilters.item}
              onChange={(e) => setStockFilters({...stockFilters, item: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left">Item</th>
                  <th className="py-2 px-4 border-b text-left">Current Stock</th>
                  <th className="py-2 px-4 border-b text-left">Min Stock</th>
                  <th className="py-2 px-4 border-b text-left">Max Stock</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map(item => {
                  const stockStatus = getStockStatus(item.currentStock, item.minStock, item.maxStock);
                  return (
                    <tr key={item._id}>
                      <td className="py-2 px-4 border-b">{item.name}</td>
                      <td className="py-2 px-4 border-b">{item.currentStock}</td>
                      <td className="py-2 px-4 border-b">{item.minStock}</td>
                      <td className="py-2 px-4 border-b">{item.maxStock}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Settings Component
  const Settings = () => {
    const saveSettings = async () => {
      try {
        // In real app, save to backend
        alert('Settings saved successfully!');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Branch Orders Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Approval Limit ($)
              </label>
              <input
                type="number"
                value={settings.autoApprovalLimit}
                onChange={(e) => setSettings({...settings, autoApprovalLimit: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter amount"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Deadline (Hours)
              </label>
              <input
                type="number"
                value={settings.orderDeadline}
                onChange={(e) => setSettings({...settings, orderDeadline: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter hours"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Branch
              </label>
              <select
                value={settings.defaultBranch}
                onChange={(e) => setSettings({...settings, defaultBranch: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select default branch...</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable Email Notifications
              </label>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveSettings}
              className="bg-[#735dff] text-white px-6 py-2 rounded-md hover:bg-[#5a47d6]"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'create-orders':
        return <CreateOrders />;
      case 'submit-order':
        return <SubmitOrder />;
      case 'order-history':
        return <OrderHistory />;
      case 'order-fulfilment':
        return <OrderFulfilment />;
      case 'stock-count':
        return <StockCount />;
      case 'settings':
        return <Settings />;
      default:
        return <CreateOrders />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Branch Orders</h2>
        <div className="text-sm text-gray-600">
          Manage orders, stock, and branch operations
        </div>
      </div>

      <TabNavigation />
      {renderActiveTab()}
    </div>
  );
};

export default BranchOrders; 