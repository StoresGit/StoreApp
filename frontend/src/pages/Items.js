import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';
import { useNavigate } from 'react-router-dom';
import { fetchMultipleEndpoints } from '../services/api';

const Item = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const [images, setImages] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading items data...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nameEn: '', // Item Name (Eng)
    nameAlt: '', // Item Name (Alt)
    baseUnit: '', // Base Unit
    category: '', // Item Category
    tax: '', // Tax
    image: '', // Image
    departments: [], // Keep existing departments
    name: '', // Keep existing name for compatibility
    subCategory: '' // Sub Category - now required
    // Pricing fields removed - now handled per supplier
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading items data...');
      
      const endpoints = [
        { url: '/items', key: 'items' },
        { url: '/item-categories', key: 'categories' },
        { url: '/sub-categories', key: 'subCategories' },
        { url: '/departments', key: 'departments' },
        { url: '/units', key: 'units' },
        { url: '/tax', key: 'taxes' },
        { url: '/gallery', key: 'images' }
      ];
      
      const results = await fetchMultipleEndpoints(endpoints);
      
      setItems(results.items || []);
      setCategories(results.categories || []);
      setSubCategories(results.subCategories || []);
      setDepartments(results.departments || []);
      // All units are now base units
      setUnits(results.units || []);
      setTaxes(results.taxes || []);
      setImages(results.images || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadingMessage('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter sub categories based on selected main category
  const filteredSubCategories = subCategories.filter(sub => 
    !formData.category || sub.category?._id === formData.category
  );

  // Search function
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${backend_url}/items/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset sub category when main category changes
      if (name === 'category') {
        updated.subCategory = '';
      }
      return updated;
    });
  };

  const handleDepartmentToggle = (id) => {
    setFormData(prev => {
      const updated = prev.departments.includes(id)
        ? prev.departments.filter(dep => dep !== id)
        : [...prev.departments, id];
      return { ...prev, departments: updated };
    });
  };

  const handleSubmit = async () => {
  // Validate required fields
  if (!formData.nameEn?.trim()) {
    alert('Item Name (Eng) is required');
    return;
  }
  if (!formData.baseUnit) {
    alert('Base Unit is required');
    return;
  }
  if (!formData.category) {
    alert('Category is required');
    return;
  }
  if (!formData.subCategory) {
    alert('Sub Category is required');
    return;
  }

  try {
    const submitData = {
      ...formData,
      unit: formData.baseUnit,
      name: formData.nameEn
    };

    if (editingId) {
      await axios.put(`${backend_url}/items/${editingId}`, submitData);
      fetchData();
    } else {
      const res = await axios.post(`${backend_url}/items`, submitData);
      const newItemId = res.data?._id;
      if (newItemId) {
        navigate(`/items/${newItemId}/edit`);
      }
    }

    // Reset state
    setFormData({
      nameEn: '', nameAlt: '', baseUnit: '', category: '',
      tax: '', image: '',
      departments: [], name: '', subCategory: ''
    });
    setEditingId(null);
    setShowFormModal(false);

  } catch (error) {
    console.error('Error saving item:', error);
    alert(error?.response?.data?.message || 'Error saving item');
  }
};


  const handleEdit = (item) => {
    setFormData({
      nameEn: item.nameEn || item.name || '',
      nameAlt: item.nameAlt || '',
      baseUnit: item.baseUnit?._id || '',
      category: item.category?._id || '',
      tax: item.tax?._id || '',
      image: item.image?._id || '',
      departments: item.departments?.map(d => d._id) || [],
      name: item.nameEn || item.name || '',
      subCategory: item.subCategory?._id || ''
    });
    setEditingId(item._id);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This will also delete all associated packaging for this item.')) {
      try {
        const response = await axios.delete(`${backend_url}/items/${id}`);
        
        // Show success message with packaging deletion info
        if (response.data && response.data.deletedPackagingCount !== undefined) {
          const packagingCount = response.data.deletedPackagingCount;
          const itemName = response.data.itemName || 'Item';
          if (packagingCount > 0) {
            alert(`"${itemName}" deleted successfully! Also removed ${packagingCount} associated packaging item${packagingCount !== 1 ? 's' : ''}.`);
          } else {
            alert(`"${itemName}" deleted successfully!`);
          }
        } else {
          alert('Item deleted successfully!');
        }
        
        fetchData();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#735dff] mx-auto mb-4"></div>
            <p className="text-gray-600">{loadingMessage}</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment due to server rate limiting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Items</h2>
        <button
          onClick={() => {
            setFormData({ 
              nameEn: '', 
              nameAlt: '', 
              baseUnit: '', 
              category: '', 
              tax: '', 
              image: '', 
              departments: [], 
              name: '', 
              subCategory: ''
            });
            setEditingId(null);
            setShowFormModal(true);
          }}
          className="bg-[#735dff] text-white px-4 py-2 rounded"
        >
          Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item code, name, or alternative name..."
            className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-[#735dff] focus:border-transparent"
          />
          <div className="absolute left-3 top-3 text-gray-400">
            🔍
          </div>
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#735dff]"></div>
            </div>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {searchResults.length > 0 
              ? `Found ${searchResults.length} item${searchResults.length !== 1 ? 's' : ''}`
              : searchQuery && !isSearching ? 'No items found' : ''
            }
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Item Code</th>
              <th className="p-2 border">Item Name (Eng)</th>
              <th className="p-2 border">Item Name (Alt)</th>
              <th className="p-2 border">Base Unit</th>
              <th className="p-2 border">Main Category</th>
              <th className="p-2 border">Sub Category</th>
              <th className="p-2 border">Tax</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(searchQuery ? searchResults : items).map(item => (
              <tr key={item._id} className="text-center">
                <td className="p-2 border">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-mono">
                    {item.itemCode || 'Generating...'}
                  </span>
                </td>
                <td className="p-2 border">{item.nameEn || item.name}</td>
                <td className="p-2 border">{item.nameAlt || 'N/A'}</td>
                <td className="p-2 border">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {item.baseUnit?.name || 'N/A'}
                  </span>
                </td>
                <td className="p-2 border">{item.category?.nameEn || 'N/A'}</td>
                <td className="p-2 border">{item.subCategory?.nameEn || 'N/A'}</td>
                <td className="p-2 border">{item.tax?.name || 'N/A'}</td>
                <td className="p-2 border">
                  {item.image?.url ? (
                    <img src={item.image.url} alt="img" className="w-12 h-12 object-cover mx-auto" />
                  ) : (
                    'No image'
                  )}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => navigate(`/items/${item._id}/edit`)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Item */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  setEditingId(null);
                  setFormData({ 
                    nameEn: '', 
                    nameAlt: '', 
                    baseUnit: '', 
                    category: '', 
                    tax: '', 
                    image: '', 
                    departments: [], 
                    name: '', 
                    subCategory: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleChange}
                placeholder="Item Name (Eng) *"
                className="border p-2 rounded"
              />

              <input
                type="text"
                name="nameAlt"
                value={formData.nameAlt}
                onChange={handleChange}
                placeholder="Item Name (Alt)"
                className="border p-2 rounded"
              />

              <select
                name="baseUnit"
                value={formData.baseUnit}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="">Select Base Unit *</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name} ({unit.symbol || unit.Symbol})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="border p-2 rounded flex-1"
                >
                  <option value="">Select Main Category *</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.nameEn}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => window.open('/item-category', '_blank')}
                  className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                  title="Create new main category"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2">
                <select 
                  className="border p-2 rounded flex-1" 
                  name="subCategory" 
                  value={formData.subCategory} 
                  onChange={handleChange}
                >
                  <option value="">Select Sub Category *</option>
                  {filteredSubCategories.map(sc => (
                    <option key={sc._id} value={sc._id}>{sc.nameEn}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => window.open('/sub-categories', '_blank')}
                  className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                  title="Create new sub category"
                >
                  +
                </button>
              </div>

              <select
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="">Select Tax</option>
                {taxes.map(tax => (
                  <option key={tax._id} value={tax._id}>{tax.name}</option>
                ))}
              </select>

              {/* Pricing Section Removed - Unit prices now handled per supplier */}

              <div className="col-span-2">
                <label className="block font-medium mb-1">Image</label>
                <div
                  className="w-32 h-32 border rounded flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => setShowImageModal(true)}
                >
                  {formData.image ? (
                    <img src={formData.image.url} alt="Selected" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-500">Select Image</span>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block font-medium mb-1">Departments</label>
                <div className="grid grid-cols-3 gap-2">
                  {departments.map(dept => (
                    <label key={dept._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.departments.includes(dept._id)}
                        onChange={() => handleDepartmentToggle(dept._id)}
                        className="rounded"
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setEditingId(null);
                  setFormData({ 
                    nameEn: '', 
                    nameAlt: '', 
                    baseUnit: '', 
                    category: '', 
                    tax: '', 
                    image: '', 
                    departments: [], 
                    name: '', 
                    subCategory: ''
                  });
                }}
                className="text-gray-500 px-4 py-2 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#735dff] text-white px-4 py-2 rounded hover:bg-[#5a4bcc]"
              >
                {editingId ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Select Image</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {images.map(img => (
                <div
                  key={img._id}
                  className="cursor-pointer border rounded p-2 hover:bg-gray-50"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, image: img }));
                    setShowImageModal(false);
                  }}
                >
                  <img src={img.url} alt="img" className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Item;
