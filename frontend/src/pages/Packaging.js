import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const Packaging = () => {
  const [packagingItems, setPackagingItems] = useState([]);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupByItem, setGroupByItem] = useState(true);

  const [formData, setFormData] = useState({
    itemId: '',
    type: 'base',
    amount: '',
    unit: '', // Will be auto-detected from item
    packSize: '',
    packUnit: 'x',
    description: '',
    branches: [], // Multiple branches
    brands: [] // Multiple brands
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagingRes, itemsRes, branchesRes, brandsRes] = await Promise.all([
        axios.get(`${backend_url}/packaging`),
        axios.get(`${backend_url}/items`),
        axios.get(`${backend_url}/branch`),
        axios.get(`${backend_url}/brand`)
      ]);
      setPackagingItems(packagingRes.data);
      setItems(itemsRes.data);
      setBranches(branchesRes.data);
      setBrands(brandsRes.data);
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

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    const selectedItem = items.find(item => item._id === itemId);
    
    setFormData(prev => ({
      ...prev,
      itemId,
      // Auto-detect unit from selected item
      unit: selectedItem ? selectedItem.baseUnit?.Symbol || selectedItem.unit?.Symbol || '' : ''
    }));
  };

  const handleMultiSelectChange = (e, field) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      [field]: isChecked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
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
      unit: packaging.unit || '',
      packSize: packaging.packSize || '',
      packUnit: packaging.packUnit || 'x',
      description: packaging.description || '',
      branches: packaging.branches?.map(b => b._id || b) || [],
      brands: packaging.brands?.map(b => b._id || b) || []
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
      unit: '',
      packSize: '',
      packUnit: 'x',
      description: '',
      branches: [],
      brands: []
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Packaging Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setGroupByItem(!groupByItem)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {groupByItem ? 'Show All' : 'Group by Item'}
          </button>
          <button
            onClick={handleCleanupOrphaned}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Cleanup Orphaned
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-[#735dff] text-white px-4 py-2 rounded hover:bg-[#5a4bcc]"
          >
            Add Packaging
          </button>
        </div>
      </div>

      {/* Display logic for grouped vs all items */}
      {groupByItem ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[#5B2685]">
                  {group.itemName}
                </h3>
                <span className="text-sm text-gray-600">
                  {group.packaging.length} packaging type{group.packaging.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.packaging.map(packaging => (
                  <div key={packaging._id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(packaging.type)}`}>
                        {packaging.type}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(packaging)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(packaging._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>Amount: {packaging.amount} {packaging.unit}</div>
                      {packaging.packSize && (
                        <div>Pack Size: {packaging.packSize} {packaging.packUnit}</div>
                      )}
                      {packaging.description && (
                        <div className="mt-1 text-gray-600">{packaging.description}</div>
                      )}
                      {packaging.branches && packaging.branches.length > 0 && (
                        <div className="mt-1">
                          <span className="font-medium">Branches:</span> 
                          {packaging.branches.map(branch => branch.name || branch).join(', ')}
                        </div>
                      )}
                      {packaging.brands && packaging.brands.length > 0 && (
                        <div className="mt-1">
                          <span className="font-medium">Brands:</span> 
                          {packaging.brands.map(brand => brand.nameEn || brand).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Item</th>
                <th className="p-2 border text-left">Type</th>
                <th className="p-2 border text-left">Amount</th>
                <th className="p-2 border text-left">Unit</th>
                <th className="p-2 border text-left">Pack Size</th>
                <th className="p-2 border text-left">Branches</th>
                <th className="p-2 border text-left">Brands</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packagingItems.map(packaging => (
                <tr key={packaging._id} className="hover:bg-gray-50">
                  <td className="p-2 border">{packaging.itemId?.nameEn || packaging.itemId?.name || 'Unknown'}</td>
                  <td className="p-2 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(packaging.type)}`}>
                      {packaging.type}
                    </span>
                  </td>
                  <td className="p-2 border">{packaging.amount}</td>
                  <td className="p-2 border">{packaging.unit}</td>
                  <td className="p-2 border">
                    {packaging.packSize ? `${packaging.packSize} ${packaging.packUnit}` : '-'}
                  </td>
                  <td className="p-2 border">
                    {packaging.branches?.map(branch => branch.name || branch).join(', ') || '-'}
                  </td>
                  <td className="p-2 border">
                    {packaging.brands?.map(brand => brand.nameEn || brand).join(', ') || '-'}
                  </td>
                  <td className="p-2 border">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(packaging)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(packaging._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Packaging */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  onChange={handleItemChange}
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
                  Packaging Type *
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  placeholder="e.g., base, pack, bulk, retail, wholesale, custom"
                  required
                />
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
                    Unit * (Auto-detected)
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent bg-gray-50"
                    placeholder="Auto-detected from item"
                    required
                  />
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
                  Branches
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {branches.map(branch => (
                    <label key={branch._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={branch._id}
                        checked={formData.branches.includes(branch._id)}
                        onChange={(e) => handleMultiSelectChange(e, 'branches')}
                        className="rounded"
                      />
                      <span className="text-sm">{branch.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brands
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {brands.map(brand => (
                    <label key={brand._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={brand._id}
                        checked={formData.brands.includes(brand._id)}
                        onChange={(e) => handleMultiSelectChange(e, 'brands')}
                        className="rounded"
                      />
                      <span className="text-sm">{brand.nameEn}</span>
                    </label>
                  ))}
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

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#5B2685] text-white rounded-md hover:bg-[#4A1F6F] transition-colors"
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