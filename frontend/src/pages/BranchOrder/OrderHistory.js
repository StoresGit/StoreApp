import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiService.orders.getAll();
        setOrders(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchText = `${o.orderNo} ${o.userName} ${o.section}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter ? o.status === statusFilter : true;
      return matchText && matchStatus;
    });
  }, [orders, query, statusFilter]);

  const clearHistory = async () => {
    if (!window.confirm('This will permanently delete all orders. Continue?')) return;
    try {
      setLoading(true);
      setError('');
      const deletions = filtered.length > 0 ? filtered : orders;
      await Promise.all(deletions.map(o => apiService.orders.delete(o._id)));
      setOrders(prev => prev.filter(o => !deletions.find(d => d._id === o._id)));
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to clear history');
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['Draft', 'Under Review', 'Sent to CK', 'Shipped', 'Received', 'Rejected'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order History & Tracking</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">View order history and track delivery status</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order no, user, section" className="border rounded px-3 py-2 w-64" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={clearHistory} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">{loading ? 'Deleting...' : 'Delete History (Clean)'}</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-blue-600">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Order No</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Section</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{o.orderNo}</td>
                  <td className="px-3 py-2">{o.userName}</td>
                  <td className="px-3 py-2">{o.section}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2">{new Date(o.createdAt || o.dateTime).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No orders to display</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 