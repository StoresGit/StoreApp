import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const ReceivingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receivingForm, setReceivingForm] = useState({
    receivedItems: [],
    missingItems: [],
    qualityIssues: [],
    notes: ''
  });
  const [receivingData, setReceivingData] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      // Ensure response.data is an array and filter for shipped orders
      const ordersData = Array.isArray(response.data) ? response.data : [];
      const shippedOrders = ordersData.filter(order => order.status === 'Shipped');
      setOrders(shippedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch orders');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveOrder = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (order) {
      setSelectedOrder(order);
      
      // Initialize receiving data with shipped quantities
      const initialData = {};
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          initialData[item.itemCode] = {
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            unit: item.unit,
            orderQty: item.orderQty,
            shippedQty: item.shippedQty || item.orderQty, // Use shipped qty if available, otherwise order qty
            receivedQty: '',
            variance: 0,
            notes: ''
          };
        });
      }
      
      setReceivingData(initialData);
      setReceivingForm({
        receivedItems: Array.isArray(order.items) ? order.items.map(item => ({ ...item })) : [],
        missingItems: [],
        qualityIssues: [],
        notes: ''
      });
    }
  };

  const handleReceivedQtyChange = (itemCode, value) => {
    const item = receivingData[itemCode];
    const shippedQty = parseFloat(item.shippedQty) || 0;
    const receivedQty = parseFloat(value) || 0;
    const variance = receivedQty - shippedQty;

    setReceivingData(prev => ({
      ...prev,
      [itemCode]: {
        ...prev[itemCode],
        receivedQty: value,
        variance: variance
      }
    }));
  };

  const handleItemNotesChange = (itemCode, value) => {
    setReceivingData(prev => ({
      ...prev,
      [itemCode]: {
        ...prev[itemCode],
        notes: value
      }
    }));
  };

  const handleSubmitReceiving = async () => {
    try {
      setSaving(true);
      
      // Update order items with received quantities and variances
      const updatedItems = selectedOrder.items.map(item => {
        const receivingItem = receivingData[item.itemCode];
        return {
          ...item,
          receivedQty: parseFloat(receivingItem.receivedQty) || 0,
          variance: receivingItem.variance || 0,
          receivingNotes: receivingItem.notes || ''
        };
      });

      // Check for missing items (received qty < shipped qty)
      const missingItems = updatedItems.filter(item => {
        const receivingItem = receivingData[item.itemCode];
        return (parseFloat(receivingItem.receivedQty) || 0) < (parseFloat(receivingItem.shippedQty) || 0);
      });

      const payload = {
        ...selectedOrder,
        items: updatedItems,
        status: 'Received',
        receivingNotes: receivingForm.notes,
        missingItems: missingItems.length > 0 ? missingItems.map(item => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          expectedQty: item.shippedQty,
          receivedQty: receivingData[item.itemCode].receivedQty,
          variance: receivingData[item.itemCode].variance
        })) : []
      };

      await apiService.orders.update(selectedOrder._id, payload);
      
      // Update local state
      setOrders(prev => prev.map(o => (o._id === selectedOrder._id ? { ...o, status: 'Received' } : o)));
      setSelectedOrder(null);
      setReceivingForm({ receivedItems: [], missingItems: [], qualityIssues: [], notes: '' });
      setReceivingData({});
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  const getVarianceColor = (variance) => {
    if (variance === 0) return 'text-green-600';
    if (variance > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variance) => {
    if (variance === 0) return '✓';
    if (variance > 0) return '▲';
    return '▼';
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Receiving Order</h1>
          <p className="text-gray-600">Track received quantities and identify variances or missing items.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Shipped Orders</h2>
            <p className="text-sm text-gray-600 mt-1">Orders ready for receiving</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(orders) && orders.filter(order => order.status === 'Shipped').map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.section}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : formatDate(order.dateTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{Array.isArray(order.items) ? order.items.length : 0} items</div>
                      <div className="text-sm text-gray-500">
                        {Array.isArray(order.items) && order.items.map(item => `${item.itemName} (${item.shippedQty || item.orderQty} ${item.unit})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleReceiveOrder(order._id)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md">Receive Order</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receiving Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                <h2 className="text-xl font-semibold text-gray-900">Receive Order: {selectedOrder.orderNo}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Branch: {selectedOrder.branch || 'N/A'} • Delivery: {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items Receiving</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipped Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item) => {
                        const receivingItem = receivingData[item.itemCode] || {};
                        
                        return (
                          <tr key={item.itemCode} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.itemCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.orderQty}</td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.shippedQty || item.orderQty}</td>
                            <td className="px-4 py-3 text-sm">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={receivingItem.receivedQty || ''}
                                onChange={(e) => handleReceivedQtyChange(item.itemCode, e.target.value)}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-medium ${getVarianceColor(receivingItem.variance || 0)}`}>
                                {getVarianceIcon(receivingItem.variance || 0)} {receivingItem.variance || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <input
                                type="text"
                                value={receivingItem.notes || ''}
                                onChange={(e) => handleItemNotesChange(item.itemCode, e.target.value)}
                                className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Notes..."
                              />
                            </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">General Receiving Notes</label>
                <textarea 
                  value={receivingForm.notes} 
                  onChange={(e) => setReceivingForm({...receivingForm, notes: e.target.value})} 
                  rows={3} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Optional notes about the receiving process..." 
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitReceiving} 
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Confirming...' : 'Confirm Receiving'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivingOrder; 