import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const Packaging = () => {
  const [packagingItems, setPackagingItems] = useState([]);
  const [items, setItems] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupByItem, setGroupByItem] = useState(true);

  const [formData, setFormData] = useState({
    itemId: '',
    type: 'base',
    amount: '',
    unit: 'pcs',
    packSize: '',
    packUnit: 'x',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagingRes, itemsRes] = await Promise.all([
        axios.get(`${backend_url}/packaging`),
        axios.get(`${backend_url}/items`)
      ]);
      setPackagingItems(packagingRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group packaging items by item
  const groupedPackaging = () => {
    const grouped = {};
    packagingItems.forEach(packaging => {
      const itemName = packaging.itemId?.nameEn || packaging.itemId?.name || 'Unknown Item';
      const itemId = packaging.itemId?._id || 'unknown';
      const key = `${itemName}_${itemId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          itemName,
          itemId,
          packaging: []
        };
      }
      grouped[key].packaging.push(packaging);
    });
    return grouped;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.itemId || !formData.amount || !formData.unit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        ...(formData.packSize && { packSize: parseInt(formData.packSize) })
      };

      if (editingId) {
        await axios.put(`${backend_url}/packaging/${editingId}`, submitData);
      } else {
        await axios.post(`${backend_url}/packaging`, submitData);
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving packaging:', error);
      alert('Error saving packaging item');
    }
  };

  const handleEdit = (packaging) => {
    setFormData({
      itemId: packaging.itemId?._id || '',
      type: packaging.type || 'base',
      amount: packaging.amount || '',
      unit: packaging.unit || 'pcs',
      packSize: packaging.packSize || '',
      packUnit: packaging.packUnit || 'x',
      description: packaging.description || ''
    });
    setEditingId(packaging._id);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this packaging item?')) {
      try {
        await axios.delete(`${backend_url}/packaging/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting packaging:', error);
      }
    }
  };

  const handleCleanupOrphaned = async () => {
    if (window.confirm('This will remove packaging records for deleted items. Continue?')) {
      try {
        const response = await axios.delete(`${backend_url}/packaging/cleanup/orphaned`);
        if (response.data.success) {
          const cleanedCount = response.data.cleanedCount;
          if (cleanedCount > 0) {
            alert(`Cleanup completed! Removed ${cleanedCount} orphaned packaging record${cleanedCount !== 1 ? 's' : ''}.`);
          } else {
            alert('No orphaned packaging records found.');
          }
          fetchData(); // Refresh the data
        }
      } catch (error) {
        console.error('Error cleaning up orphaned packaging:', error);
        alert('Error during cleanup. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      type: 'base',
      amount: '',
      unit: 'pcs',
      packSize: '',
      packUnit: 'x',
      description: ''
    });
    setEditingId(null);
    setShowFormModal(false);
  };

  const getTypeColor = (type) => {
    const colors = {
      'base': 'bg-purple-100 text-purple-800',
      'pack': 'bg-blue-100 text-blue-800',
      'bulk': 'bg-green-100 text-green-800',
      'retail': 'bg-yellow-100 text-yellow-800',
      'wholesale': 'bg-indigo-100 text-indigo-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-4">Loading packaging data...</div>;
  }

  const grouped = groupedPackaging();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5B2685]">Packaging Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setGroupByItem(!groupByItem)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            {groupByItem ? 'Show All' : 'Group by Item'}
          </button>
          <button
            onClick={handleCleanupOrphaned}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            title="Remove packaging records for deleted items"
          >
            Cleanup
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-[#5B2685] text-white px-4 py-2 rounded-md hover:bg-[#4A1F6F] transition-colors"
          >
            Add Packaging
          </button>
        </div>
      </div>

      {groupByItem ? (
        // Grouped View
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {group.itemName}
                  <span className="ml-2 text-sm text-gray-500">
                    ({group.packaging.length} packaging{group.packaging.length !== 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount & Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pack Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.packaging.map((packaging, index) => (
                      <tr key={packaging._id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(packaging.type)}`}>
                            {packaging.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {packaging.amount} {packaging.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {packaging.packSize ? `${packaging.packSize} ${packaging.packUnit}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {packaging.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(packaging.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(packaging)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(packaging._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm">
              No packaging items found. Click "Add Packaging" to create one.
            </div>
          )}
        </div>
      ) : (
        // Traditional Table View
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pack Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packagingItems.map((packaging) => (
                  <tr key={packaging._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {packaging.itemId?.nameEn || packaging.itemId?.name || 'Unknown Item'}
                      </div>
                      {!packaging.itemId && (
                        <div className="text-xs text-red-500">⚠️ Missing item reference</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(packaging.type)}`}>
                        {packaging.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {packaging.amount} {packaging.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {packaging.packSize ? `${packaging.packSize} ${packaging.packUnit}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {packaging.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(packaging.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(packaging)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(packaging._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {packagingItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No packaging items found. Click "Add Packaging" to create one.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#5B2685]">
                {editingId ? 'Edit Packaging' : 'Add Packaging'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item *
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.nameEn || item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                >
                  <option value="base">Base</option>
                  <option value="pack">Pack</option>
                  <option value="bulk">Bulk</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                    placeholder="1.0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="number"
                    name="packSize"
                    value={formData.packSize}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Unit
                  </label>
                  <select
                    name="packUnit"
                    value={formData.packUnit}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  >
                    <option value="x">x</option>
                    <option value="per">per</option>
                    <option value="of">of</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-[#5B2685] text-white rounded-md hover:bg-[#4A1F6F] transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Packaging
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packaging; 