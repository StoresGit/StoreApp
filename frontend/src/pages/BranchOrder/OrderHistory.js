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
        const allOrders = Array.isArray(res?.data) ? res.data : [];
        
        console.log('=== FETCHING ORDER HISTORY ===');
        console.log('Total orders fetched:', allOrders.length);
        console.log('All order statuses:', allOrders.map(o => ({ orderNo: o.orderNo, status: o.status, _id: o._id })));
        
        // Check for orders with "Sent to Central Kitchen" status
        const sentToCKOrders = allOrders.filter(o => o.status === 'Sent to Central Kitchen');
        console.log('Orders sent to Central Kitchen:', sentToCKOrders.length);
        console.log('Sent to CK orders:', sentToCKOrders.map(o => ({ orderNo: o.orderNo, status: o.status, _id: o._id })));
        
        // Sort orders by creation date (newest first)
        const sortedOrders = allOrders.sort((a, b) => 
          new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime)
        );
        
        setOrders(sortedOrders);
      } catch (e) {
        console.error('Error fetching orders:', e);
        setError(e.response?.data?.error || e.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchText = `${o.orderNo} ${o.userName} ${o.section} ${o.branchName || o.branch || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter ? o.status === statusFilter : true;
      return matchText && matchStatus;
    });
  }, [orders, query, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      case 'Sent to Central Kitchen': return 'bg-purple-100 text-purple-800';
      case 'Under Process': return 'bg-yellow-100 text-yellow-800';
      case 'Shipped': return 'bg-green-100 text-green-800';
      case 'Received': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItemsSummary = (order) => {
    const names = Array.isArray(order.items) ? order.items.map(i => i.itemName).filter(Boolean) : [];
    const preview = names.slice(0, 2).join(', ');
    const more = names.length > 2 ? ` +${names.length - 2} more` : '';
    return `${names.length} item${names.length !== 1 ? 's' : ''}${names.length ? ` (${preview}${more})` : ''}`;
  };

  const statuses = ['Draft', 'Under Review', 'Sent to Central Kitchen', 'Under Process', 'Shipped', 'Received', 'Rejected'];

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-white">Order History & Tracking</h1>
          <p className="text-blue-100 mt-1">View order history and track delivery status</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Search order no, user, section, branch..." 
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => {
                setLoading(true);
                const fetchOrders = async () => {
                  try {
                    setError('');
                    const res = await apiService.orders.getAll();
                    const allOrders = Array.isArray(res?.data) ? res.data : [];
                    
                    // Sort orders by creation date (newest first)
                    const sortedOrders = allOrders.sort((a, b) => 
                      new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime)
                    );
                    
                    setOrders(sortedOrders);
                  } catch (e) {
                    setError(e.response?.data?.error || e.message || 'Failed to load order history');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchOrders();
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No orders to display</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Central Kitchen Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {o.orderNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {o.branchName || o.branch || o.branchNameEn || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {o.section || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderItemsSummary(o)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {o.status === 'Sent to Central Kitchen' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      ) : o.status === 'Under Process' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Accepted
                        </span>
                      ) : o.status === 'Rejected' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      ) : o.status === 'Shipped' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Accepted
                        </span>
                      ) : o.status === 'Received' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Accepted
                        </span>
                      ) : o.status === 'Draft' || o.status === 'Under Review' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Sent
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(o.createdAt || o.dateTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filtered.filter(o => o.status === 'Sent to Central Kitchen').length}
                </div>
                <div className="text-gray-600">Sent to Central Kitchen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filtered.filter(o => o.status === 'Under Process').length}
                </div>
                <div className="text-gray-600">Under Process</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filtered.filter(o => o.status === 'Shipped').length}
                </div>
                <div className="text-gray-600">Shipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filtered.filter(o => o.status === 'Rejected').length}
                </div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
            
            {/* Central Kitchen Status Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Central Kitchen Status Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filtered.filter(o => o.status === 'Sent to Central Kitchen').length}
                  </div>
                  <div className="text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filtered.filter(o => ['Under Process', 'Shipped', 'Received'].includes(o.status)).length}
                  </div>
                  <div className="text-gray-600">Accepted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filtered.filter(o => o.status === 'Rejected').length}
                  </div>
                  <div className="text-gray-600">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 