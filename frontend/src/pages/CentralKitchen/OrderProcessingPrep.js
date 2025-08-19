import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const OrderProcessingPrep = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingData, setProcessingData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnderProcessOrders();
  }, []);

  const fetchUnderProcessOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      const allOrders = response.data || [];
      
      // Filter orders that are under process
      const underProcessOrders = allOrders.filter(order => 
        order.status === 'Under Process'
      );
      
      setOrders(underProcessOrders);
    } catch (err) {
      setError('Failed to fetch orders under process');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrder = (order) => {
    setSelectedOrder(order);
    // Initialize processing data with order quantities
    const initialData = {};
    order.items.forEach(item => {
      initialData[item.itemCode] = {
        orderQty: item.orderQty,
        shippedQty: '',
        variance: 0
      };
    });
    setProcessingData(initialData);
    setShowProcessingModal(true);
  };

  const closeProcessingModal = () => {
    setShowProcessingModal(false);
    setSelectedOrder(null);
    setProcessingData({});
  };

  const handleShippedQtyChange = (itemCode, value) => {
    const orderQty = processingData[itemCode].orderQty;
    const shippedQty = parseFloat(value) || 0;
    const variance = shippedQty - orderQty;

    setProcessingData(prev => ({
      ...prev,
      [itemCode]: {
        ...prev[itemCode],
        shippedQty: value,
        variance: variance
      }
    }));
  };

  const saveProcessingData = async () => {
    if (!selectedOrder?._id) return;
    
    try {
      setSaving(true);
      
      // Update order items with shipped quantities
      const updatedItems = selectedOrder.items.map(item => {
        const processingItem = processingData[item.itemCode];
        return {
          ...item,
          shippedQty: parseFloat(processingItem.shippedQty) || 0,
          variance: processingItem.variance || 0
        };
      });

      // Check if all items have been processed
      const allProcessed = updatedItems.every(item => 
        item.shippedQty > 0 || item.shippedQty === 0
      );

      const payload = {
        ...selectedOrder,
        items: updatedItems,
        status: allProcessed ? 'Shipped' : 'Under Process'
      };

      await apiService.orders.update(selectedOrder._id, payload);
      
      // Refresh orders list
      await fetchUnderProcessOrders();
      
      closeProcessingModal();
    } catch (err) {
      setError('Failed to save processing data');
      console.error('Error saving processing data:', err);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading Order Processing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Order Processing & Prep</h1>
          <p className="text-gray-700 mt-1">Enter shipped quantities and track variances</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Under Process</h3>
            <p className="text-gray-500">Accepted orders will appear here for processing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleProcessOrder(order)}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Process Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {showProcessingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Process Order #{selectedOrder.orderNo}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Branch: {selectedOrder.branch || 'N/A'} • Delivery: {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <button onClick={closeProcessingModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shipped Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => {
                      const processingItem = processingData[item.itemCode] || { orderQty: item.orderQty, shippedQty: '', variance: 0 };
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.itemCode}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {item.category}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {processingItem.orderQty}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={processingItem.shippedQty}
                              onChange={(e) => handleShippedQtyChange(item.itemCode, e.target.value)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`font-medium ${getVarianceColor(processingItem.variance)}`}>
                              {getVarianceIcon(processingItem.variance)} {processingItem.variance}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeProcessingModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProcessingData}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Ship Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderProcessingPrep; 