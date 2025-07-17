import React, { useState, useEffect } from 'react';

const StockCount = () => {
  const [stockCounts, setStockCounts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [newStockCount, setNewStockCount] = useState({
    section: '',
    countDate: new Date().toISOString().split('T')[0],
    items: [],
    notes: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockItems = [
      { id: 1, name: 'Chicken Breast', category: 'Meat', unit: 'kg', currentStock: 25, section: 'Freezer' },
      { id: 2, name: 'Rice', category: 'Grains', unit: 'kg', currentStock: 50, section: 'Dry Storage' },
      { id: 3, name: 'Tomatoes', category: 'Vegetables', unit: 'kg', currentStock: 15, section: 'Refrigerator' },
      { id: 4, name: 'Beef', category: 'Meat', unit: 'kg', currentStock: 30, section: 'Freezer' },
      { id: 5, name: 'Onions', category: 'Vegetables', unit: 'kg', currentStock: 20, section: 'Dry Storage' },
      { id: 6, name: 'Fish', category: 'Seafood', unit: 'kg', currentStock: 12, section: 'Freezer' },
      { id: 7, name: 'Potatoes', category: 'Vegetables', unit: 'kg', currentStock: 35, section: 'Dry Storage' },
      { id: 8, name: 'Milk', category: 'Dairy', unit: 'L', currentStock: 8, section: 'Refrigerator' }
    ];

    const mockStockCounts = [
      {
        id: 1,
        section: 'Freezer',
        countDate: '2024-01-15',
        status: 'Completed',
        totalItems: 3,
        variance: 2,
        notes: 'Regular monthly count'
      },
      {
        id: 2,
        section: 'Dry Storage',
        countDate: '2024-01-14',
        status: 'In Progress',
        totalItems: 4,
        variance: 0,
        notes: 'Weekly count'
      }
    ];

    setTimeout(() => {
      setItems(mockItems);
      setStockCounts(mockStockCounts);
      setLoading(false);
    }, 1000);
  }, []);

  const sections = ['Freezer', 'Refrigerator', 'Dry Storage', 'Pantry', 'All Sections'];

  const handleCreateStockCount = () => {
    setShowCreateForm(true);
    setNewStockCount({
      section: '',
      countDate: new Date().toISOString().split('T')[0],
      items: [],
      notes: ''
    });
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setNewStockCount({...newStockCount, section});
    
    if (section === 'All Sections') {
      setSelectedItems(items);
    } else {
      setSelectedItems(items.filter(item => item.section === section));
    }
  };

  const handleItemCountChange = (itemId, countedQty) => {
    setNewStockCount(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, countedQty: parseInt(countedQty) || 0 }
          : item
      )
    }));
  };

  const handleSubmitStockCount = () => {
    const stockCountData = {
      ...newStockCount,
      id: Date.now(),
      status: 'Completed',
      totalItems: newStockCount.items.length,
      variance: newStockCount.items.reduce((total, item) => 
        total + Math.abs(item.countedQty - item.currentStock), 0
      )
    };

    setStockCounts(prev => [stockCountData, ...prev]);
    setShowCreateForm(false);
    setSelectedSection('');
    setSelectedItems([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Count</h1>
          <p className="text-gray-600">Create stock count by section or by particular item and submit it</p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateStockCount}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Stock Count
          </button>
        </div>

        {/* Stock Counts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Stock Counts</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage stock count records</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Counted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockCounts.map((count) => (
                  <tr key={count.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{count.section}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{count.countDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(count.status)}`}>
                        {count.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{count.totalItems} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${count.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {count.variance} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View Details</button>
                      <button className="text-green-600 hover:text-green-900">Export</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Stock Count Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Stock Count</h2>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a section...</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                {/* Count Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Count Date</label>
                  <input
                    type="date"
                    value={newStockCount.countDate}
                    onChange={(e) => setNewStockCount({...newStockCount, countDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Items Table */}
                {selectedItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Items to Count</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counted Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedItems.map((item) => {
                            const countedQty = newStockCount.items.find(i => i.id === item.id)?.countedQty || 0;
                            const variance = countedQty - item.currentStock;
                            
                            return (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{item.category}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{item.unit}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{item.currentStock}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    value={countedQty}
                                    onChange={(e) => handleItemCountChange(item.id, e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm font-medium ${variance !== 0 ? (variance > 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-900'}`}>
                                    {variance > 0 ? '+' : ''}{variance}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={newStockCount.notes}
                    onChange={(e) => setNewStockCount({...newStockCount, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this stock count..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitStockCount}
                    disabled={!selectedSection || selectedItems.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Submit Stock Count
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCount; 