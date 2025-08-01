import React, { useState, useEffect } from 'react';

const CentralKitchenDashboard = () => {
  // Placeholder state for filters and orders
  const [filters, setFilters] = useState({ branch: '', date: '', status: '', urgency: '' });
  
  // Placeholder effect for fetching orders
  useEffect(() => {
    // TODO: Fetch orders from backend
    // setLoading(false); // Removed since loading state is not used
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Central Kitchen Dashboard</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input type="text" placeholder="Branch" value={filters.branch} onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))} className="border rounded px-3 py-2 w-full" />
            <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="border rounded px-3 py-2 w-full" />
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded px-3 py-2 w-full">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={filters.urgency} onChange={e => setFilters(f => ({ ...f, urgency: e.target.value }))} className="border rounded px-3 py-2 w-full">
              <option value="">All Urgency</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
              <option value="Schedule">Schedule</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Placeholder: No orders yet */}
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">No orders to display yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CentralKitchenDashboard; 