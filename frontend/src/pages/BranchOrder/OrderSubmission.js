import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { MasterAdminOnly } from '../../components/PermissionGuard';

const OrderSubmission = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Fetch reference data and orders
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const ordersRes = await apiService.orders.getAll();
        const relevantOrders = Array.isArray(ordersRes?.data)
          ? ordersRes.data.filter(o => o.status === 'Draft' || o.status === 'Under Review')
          : [];
        setOrders(relevantOrders);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openModal = (order) => {
    setActiveOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveOrder(null);
  };

  const openEditModal = (order) => {
    setEditingOrder(JSON.parse(JSON.stringify(order))); // Deep clone for editing
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingOrder(null);
  };

  const handleEditItemChange = (idx, field, value) => {
    setEditingOrder(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === idx ? { ...it, [field]: value } : it)
    }));
  };

  const saveEdit = async () => {
    if (!editingOrder?._id) return;
    try {
      setEditSaving(true);
      await apiService.orders.update(editingOrder._id, editingOrder);
      // Update the order in the local state
      setOrders(prev => prev.map(o => o._id === editingOrder._id ? editingOrder : o));
      closeEditModal();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to update order');
    } finally {
      setEditSaving(false);
    }
  };





  const sendToCK = async (order = null) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder?._id) return;
    try {
      setSaving(true);
      // Update straight to 'Shipped' so it appears in Receiving Orders page
      const payload = { ...targetOrder, status: 'Shipped' };
      await apiService.orders.update(targetOrder._id, payload);
      // Remove from current view since it's no longer Under Review
      setOrders(prev => prev.filter(o => o._id !== targetOrder._id));
      if (!order) {
        closeModal(); // Only close modal if called from modal
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to send to CK');
    } finally {
      setSaving(false);
    }
  };

  const changeToUnderReview = async (order) => {
    if (!order?._id) return;
    try {
      setSaving(true);
      const payload = { ...order, status: 'Under Review' };
      await apiService.orders.update(order._id, payload);
      // Update the order in the local state
      setOrders(prev => prev.map(o => o._id === order._id ? payload : o));
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to change status to Under Review');
    } finally {
      setSaving(false);
    }
  };

  const renderItemsSummary = (order) => {
    const names = Array.isArray(order.items) ? order.items.map(i => i.itemName).filter(Boolean) : [];
    const preview = names.slice(0, 2).join(', ');
    const more = names.length > 2 ? ` +${names.length - 2} more` : '';
    return `${names.length} item${names.length !== 1 ? 's' : ''}${names.length ? ` (${preview}${more})` : ''}`;
  };

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Order Submission</h1>
        <p className="text-gray-600 mb-6">Orders submitted for approval appear here. You can review and edit item details, then send the order to Central Kitchen (CK).</p>
      
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No orders in Under Review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Order No</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Section</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Delivery Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} className="border-b border-gray-200">
                    <td className="px-3 py-2">{order.orderNo}</td>
                    <td className="px-3 py-2">{order.userName}</td>
                    <td className="px-3 py-2">{order.section}</td>
                    <td className="px-3 py-2">{renderItemsSummary(order)}</td>
                    <td className="px-3 py-2">{new Date(order.createdAt || order.dateTime).toLocaleString()}</td>
                    <td className="px-3 py-2">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'Under Review' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(order)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          View
                        </button>
                        {order.status === 'Under Review' && (
                          <button
                            onClick={() => openEditModal(order)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          >
                            Edit
                          </button>
                        )}
                        {order.status === 'Draft' && (
                          <button
                            onClick={() => changeToUnderReview(order)}
                            disabled={saving}
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 text-sm"
                          >
                            {saving ? 'Processing...' : 'Send to Review'}
                          </button>
                        )}
                        {order.status === 'Under Review' && (
                          <button
                            onClick={() => sendToCK(order)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {saving ? 'Processing...' : 'Send to Central Kitchen'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Modal */}
        {modalOpen && activeOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">Order #{activeOrder.orderNo}</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="font-medium">Status:</span> {activeOrder.status}</div>
                <div><span className="font-medium">Date & Time:</span> {new Date(activeOrder.dateTime).toLocaleString()}</div>
                <div><span className="font-medium">User:</span> {activeOrder.userName}</div>
                <div><span className="font-medium">Order Type:</span> {activeOrder.orderType || activeOrder.type || '-'}</div>
                <div><span className="font-medium">Branch:</span> {activeOrder.branchName || activeOrder.branch || activeOrder.branchNameEn || activeOrder.branchNameAr || '-'}</div>
                <div><span className="font-medium">Section:</span> {activeOrder.section}</div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Item Code</th>
                      <th className="border px-2 py-1">Item Name</th>
                      <th className="border px-2 py-1">Item Category</th>
                      <th className="border px-2 py-1">Unit</th>
                      <th className="border px-2 py-1">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrder.items.map((it, idx) => (
                      <tr key={`${it.itemCode}-${idx}`}>
                        <td className="border px-2 py-1">
                          <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.itemCode} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-40 border rounded px-1 py-0.5 bg-gray-100" value={it.itemName} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-36 border rounded px-1 py-0.5 bg-gray-100" value={it.category} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.unit} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input type="number" className="w-20 border rounded px-1 py-0.5 bg-gray-100" value={it.orderQty} readOnly />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={sendToCK} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">{saving ? 'Processing...' : 'Submit Order'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">Edit Order #{editingOrder.orderNo}</h3>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="font-medium">Status:</span> {editingOrder.status}</div>
                <div><span className="font-medium">Date & Time:</span> {new Date(editingOrder.dateTime).toLocaleString()}</div>
                <div><span className="font-medium">User:</span> {editingOrder.userName}</div>
                <div><span className="font-medium">Order Type:</span> {editingOrder.orderType || editingOrder.type || '-'}</div>
                <div><span className="font-medium">Branch:</span> {editingOrder.branchName || editingOrder.branch || editingOrder.branchNameEn || editingOrder.branchNameAr || '-'}</div>
                <div><span className="font-medium">Section:</span> {editingOrder.section}</div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Item Code</th>
                      <th className="border px-2 py-1">Item Name</th>
                      <th className="border px-2 py-1">Item Category</th>
                      <th className="border px-2 py-1">Unit</th>
                      <th className="border px-2 py-1">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingOrder.items.map((it, idx) => (
                      <tr key={`${it.itemCode}-${idx}`}>
                        <td className="border px-2 py-1">
                          <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.itemCode} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-40 border rounded px-1 py-0.5 bg-gray-100" value={it.itemName} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-36 border rounded px-1 py-0.5 bg-gray-100" value={it.category || '-'} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.unit} readOnly />
                        </td>
                        <td className="border px-2 py-1">
                          <input 
                            type="number" 
                            min="0" 
                            className="w-20 border rounded px-1 py-0.5" 
                            value={it.orderQty} 
                            onChange={e => handleEditItemChange(idx, 'orderQty', parseInt(e.target.value) || 0)} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={closeEditModal} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MasterAdminOnly>
  );
};

export default OrderSubmission; 