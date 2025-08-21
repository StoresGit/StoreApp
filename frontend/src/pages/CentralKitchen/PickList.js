import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const PickList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    fetchAcceptedOrders();
  }, []);

  const fetchAcceptedOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orders.getAll();
      const allOrders = response.data || [];
      
      console.log('All orders fetched:', allOrders.length);
      console.log('Order statuses:', allOrders.map(o => o.status));
      
      // Filter orders that are accepted and under process
      const acceptedOrders = allOrders.filter(order => 
        order.status === 'Under Process'
      );
      
      console.log('Accepted orders (Under Process):', acceptedOrders.length);
      
      setOrders(acceptedOrders);
    } catch (err) {
      setError('Failed to fetch accepted orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPickList = (order) => {
    setSelectedOrder(order);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    setSelectedOrder(null);
  };

  const printPickList = () => {
    const printWindow = window.open('', '_blank');
    const order = selectedOrder;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pick List - ${order.orderNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .order-info { margin-bottom: 20px; }
          .order-info table { width: 100%; border-collapse: collapse; }
          .order-info td { padding: 5px; border: 1px solid #ddd; }
          .pick-list { margin-top: 30px; }
          .pick-list table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .pick-list th, .pick-list td { padding: 10px; border: 1px solid #333; text-align: left; }
          .pick-list th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PICK LIST</h1>
          <h2>Order #${order.orderNo}</h2>
        </div>
        
        <div class="order-info">
          <table>
            <tr>
              <td><strong>Order No:</strong></td>
              <td>${order.orderNo}</td>
              <td><strong>Branch:</strong></td>
              <td>${order.branch || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Delivery Date:</strong></td>
              <td>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</td>
              <td><strong>Order Date:</strong></td>
              <td>${new Date(order.dateTime).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td><strong>Section:</strong></td>
              <td>${order.section}</td>
              <td><strong>Order Type:</strong></td>
              <td>${order.orderType || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <div class="pick-list">
          <h3>Items to Pick</h3>
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Order Qty</th>
                <th>Picked Qty</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item, index) => `
                <tr>
                  <td>${item.itemCode}</td>
                  <td>${item.itemName}</td>
                  <td>${item.category}</td>
                  <td>${item.unit}</td>
                  <td>${item.orderQty}</td>
                  <td style="border: 2px solid #000; min-height: 30px;"></td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Pick List for Central Kitchen</p>
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Pick List
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading Pick List...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-blue-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Pick List</h1>
          <p className="text-gray-700 mt-1">Only accepted orders ready for picking</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Ready for Picking</h3>
            <p className="text-gray-500">Accepted orders will appear here for pick list generation.</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.dateTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePrintPickList(order)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Print Pick List
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Modal */}
      {showPrintModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Print Pick List</h3>
              <button onClick={closePrintModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Ready to print pick list for:</p>
              <p className="font-medium text-gray-900">Order #{selectedOrder.orderNo}</p>
              <p className="text-sm text-gray-500">
                {selectedOrder.items?.length || 0} items • {selectedOrder.branch || 'N/A'}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={printPickList}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Print Pick List
              </button>
              <button
                onClick={closePrintModal}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickList; 