import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const CreateItem = () => {
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    itemCategory: '',
    subCategory: '', // Added sub-category field
    unit: '',
    assignBranch: [],
    assignSection: '', // Changed from array to single value
    assignBrand: '' // Added assign brand field
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]); // Global sub-categories for form
  const [itemSubCategories, setItemSubCategories] = useState({}); // Item-specific sub-categories for editing
  const [units, setUnits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [items, setItems] = useState([]); // Added items state
  const [itemsLoading, setItemsLoading] = useState(true); // Added items loading state
  const [brands, setBrands] = useState([]); // Added brands state
  const [editingItem, setEditingItem] = useState(null); // Add editing state
  const [editFormData, setEditFormData] = useState({}); // Add edit form data
  


  // Fetch items
  const fetchItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${backend_url}/items`, { headers });
      console.log('Fetched items:', response.data); // Debug log
      console.log('Sample item with brand:', response.data?.[0]); // Debug specific item
      console.log('Brands available:', brands); // Debug brands state
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [brands]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [categoriesRes, unitsRes, branchesRes, sectionsRes, brandsRes] = await Promise.all([
        axios.get(`${backend_url}/item-categories`, { headers }),
        axios.get(`${backend_url}/units/branch`, { headers }), // Changed to fetch only branch units
        axios.get(`${backend_url}/branch`, { headers }),
        axios.get(`${backend_url}/sections`, { headers }),
        axios.get(`${backend_url}/brand`, { headers }) // Added brands API call
      ]);

      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
      setBranches(branchesRes.data);
      setSections(sectionsRes.data);
      setBrands(brandsRes.data); // Set brands data
      setFilteredCategories(categoriesRes.data); // Initialize filtered categories
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchItems(); // Fetch items separately
  }, [fetchItems]);

  // Filter sections when branch changes
  useEffect(() => {
    // Show all sections without filtering by branches
    setFilteredSections(sections);
  }, [sections]);

  // Filter categories based on search
  useEffect(() => {
    if (searchCategory) {
      const filtered = categories.filter(category =>
        category.nameEn?.toLowerCase().includes(searchCategory.toLowerCase()) ||
        category.name?.toLowerCase().includes(searchCategory.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchCategory, categories]);

  // Fetch sub-categories when category changes
  useEffect(() => {
    if (formData.itemCategory) {
      fetchSubCategories(formData.itemCategory);
    } else {
      setSubCategories([]);
      setFormData(prev => ({ ...prev, subCategory: '' }));
    }
  }, [formData.itemCategory]);

  // Fetch sub-categories for selected category
  const fetchSubCategories = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${backend_url}/item-categories/subcategories/${categoryId}`, { headers });
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      setSubCategories([]);
    }
  };

  // Fetch sub-categories for a specific item (for editing)
  const fetchItemSubCategories = async (itemId, categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${backend_url}/item-categories/subcategories/${categoryId}`, { headers });
      setItemSubCategories(prev => ({
        ...prev,
        [itemId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching sub-categories for item:', error);
      setItemSubCategories(prev => ({
        ...prev,
        [itemId]: []
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'assignBranch') {
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategorySelect = (categoryId, categoryName) => {
    setFormData(prev => ({ ...prev, itemCategory: categoryId }));
    setSearchCategory(categoryName);
    setShowCategoryDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    const requiredFields = {
      itemName: formData.itemName,
      itemCategory: formData.itemCategory,
      unit: formData.unit
    };
    
    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Ensure subcategory is properly set
      let subCategoryValue = formData.subCategory;
      if (!subCategoryValue || subCategoryValue === '') {
        // If no subcategory is selected, use the main category as subcategory
        subCategoryValue = formData.itemCategory;
      }
      
      const itemData = {
        nameEn: formData.itemName, // Changed from name to nameEn
        name: formData.itemName, // Keep name for compatibility
        category: formData.itemCategory,
        subCategory: subCategoryValue, // Use the validated subcategory
        unit: formData.unit,
        baseUnit: formData.unit, // Add baseUnit field - backend expects this
        assignBranch: formData.assignBranch.length > 0 ? formData.assignBranch : undefined, // Send all selected branches
        assignBrand: formData.assignBrand || undefined, // Add assign brand
        departments: formData.assignSection ? [formData.assignSection] : []
      };

      console.log('Submitting item data:', itemData); // Debug log

      await axios.post(`${backend_url}/items`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setFormData({
        itemCode: '',
        itemName: '',
        itemCategory: '',
        subCategory: '', // Reset sub-category
        unit: '',
        assignBranch: [],
        assignSection: '',
        assignBrand: '' // Reset assign brand
      });
      setSearchCategory('');
      setSubCategories([]); // Reset sub-categories
      
      // Refresh items list
      fetchItems();
      
      // Show success message
      alert('Item created successfully!');
    } catch (error) {
      console.error('Error creating item:', error);
      console.error('Error response:', error.response?.data); // Debug log
      alert('Error creating item: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        await axios.delete(`${backend_url}/items/${itemId}`, { headers });
        alert('Item deleted successfully');
        fetchItems(); // Refresh the list
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item._id);
    setEditFormData({
      nameEn: item.nameEn || item.name,
      category: item.category?._id || item.category,
      subCategory: item.subCategory?._id || item.subCategory,
      unit: item.unit?._id || item.baseUnit?._id || item.unit,
      assignBrand: item.assignBrand?._id || item.assignBrand,
      assignBranch: item.assignBranch || [],
      assignSection: item.departments?.[0] || item.assignSection
    });
    
    // Fetch subcategories for this specific item
    const categoryId = item.category?._id || item.category;
    if (categoryId) {
      fetchItemSubCategories(item._id, categoryId);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditFormData({});
    // Clean up item-specific subcategories for the cancelled edit
    if (editingItem) {
      setItemSubCategories(prev => {
        const newState = { ...prev };
        delete newState[editingItem];
        return newState;
      });
    }
  };

  const handleSaveEdit = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const updateData = {
        nameEn: editFormData.nameEn,
        name: editFormData.nameEn, // Keep name for compatibility
        category: editFormData.category,
        subCategory: editFormData.subCategory || editFormData.category,
        unit: editFormData.unit,
        baseUnit: editFormData.unit,
        assignBrand: editFormData.assignBrand,
        assignBranch: editFormData.assignBranch.length > 0 ? editFormData.assignBranch : undefined,
        departments: editFormData.assignSection ? [editFormData.assignSection] : []
      };

      await axios.put(`${backend_url}/items/${itemId}`, updateData, { headers });
      alert('Item updated successfully');
      setEditingItem(null);
      setEditFormData({});
      // Clean up item-specific subcategories after saving
      setItemSubCategories(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      fetchItems(); // Refresh the list
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'assignBranch') {
        setEditFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      }
    } else {
      setEditFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // If category changed, fetch subcategories for this item and reset subcategory
        if (name === 'category' && editingItem) {
          if (value) {
            fetchItemSubCategories(editingItem, value);
          } else {
            setItemSubCategories(prev => ({
              ...prev,
              [editingItem]: []
            }));
          }
          newData.subCategory = ''; // Reset subcategory when category changes
        }
        
        return newData;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Create Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mb-8">
          {/* Item Code */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Code:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="itemCode"
                value={formData.itemCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Auto generated"
                disabled
              />
            </div>
          </div>

          {/* Item Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter item name"
                required
              />
            </div>
          </div>

          {/* Item Category */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Category:</div>
            <div className="col-span-2 relative">
              <input
                type="text"
                placeholder="Search and select category..."
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <div
                        key={category._id}
                        onClick={() => handleCategorySelect(category._id, category.nameEn || category.name)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {category.nameEn || category.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">No categories found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sub Category */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Sub Category:</div>
            <div className="col-span-2">
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!formData.itemCategory}
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory._id} value={subCategory._id}>
                    {subCategory.nameEn || subCategory.name}
                  </option>
                ))}
              </select>
              {!formData.itemCategory && (
                <p className="text-sm text-gray-500 mt-1">Please select a category first</p>
              )}
              {formData.itemCategory && subCategories.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No sub-categories available for this category</p>
              )}
            </div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Unit:</div>
            <div className="col-span-2">
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign Brand */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Brand:</div>
            <div className="col-span-2">
              <select
                name="assignBrand"
                value={formData.assignBrand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.nameEn} {brand.nameAr && `(${brand.nameAr})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign Branch */}
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="font-medium text-gray-700">Assign Branch:</div>
            <div className="col-span-2">
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {branches.map((branch) => (
                  <label key={branch._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="assignBranch"
                      value={branch._id}
                      checked={formData.assignBranch.includes(branch._id)}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{branch.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Assign Section */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Section:</div>
            <div className="col-span-2">
              <select
                name="assignSection"
                value={formData.assignSection}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Section</option>
                {filteredSections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button 
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Item
            </button>
          </div>
        </form>

        {/* Items List Section */}
        <div className="mt-8">
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Items</h2>
            
            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading items...</span>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Mobile Cards View */}
                <div className="block sm:hidden">
                  {items.map((item) => (
                    <div key={item._id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.nameEn}</h3>
                          <p className="text-sm text-gray-500">{item.itemCode}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-1 text-gray-900">{item.category?.nameEn || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sub Category:</span>
                          <span className="ml-1 text-gray-900">
                            {item.subCategory?.nameEn || item.subCategory?.name || (item.subCategory === item.category ? '-' : item.subCategory) || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit:</span>
                          <span className="ml-1 text-gray-900">{item.unit?.name || item.baseUnit?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Brand:</span>
                          <span className="ml-1 text-gray-900">{item.assignBrand?.nameEn || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items found. Create your first item above!</p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name (English)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.itemCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <input
                                type="text"
                                value={editFormData.nameEn || ''}
                                onChange={(e) => handleEditInputChange({ target: { name: 'nameEn', value: e.target.value } })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : (
                              item.nameEn
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <select
                                value={editFormData.category || ''}
                                onChange={(e) => handleEditInputChange({ target: { name: 'category', value: e.target.value } })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                  <option key={category._id} value={category._id}>
                                    {category.nameEn || category.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.category?.nameEn || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <select
                                value={editFormData.subCategory || ''}
                                onChange={(e) => handleEditInputChange({ target: { name: 'subCategory', value: e.target.value } })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                disabled={!editFormData.category}
                              >
                                <option value="">Select Sub Category</option>
                                {(itemSubCategories[item._id] || []).map((subCategory) => (
                                  <option key={subCategory._id} value={subCategory._id}>
                                    {subCategory.nameEn || subCategory.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.subCategory?.nameEn || item.subCategory?.name || (item.subCategory === item.category ? '-' : item.subCategory) || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <select
                                value={editFormData.unit || ''}
                                onChange={(e) => handleEditInputChange({ target: { name: 'unit', value: e.target.value } })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="">Select Unit</option>
                                {units.map((unit) => (
                                  <option key={unit._id} value={unit._id}>
                                    {unit.name} ({unit.symbol})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.unit?.name || item.baseUnit?.name || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <select
                                value={editFormData.assignBrand || ''}
                                onChange={(e) => handleEditInputChange({ target: { name: 'assignBrand', value: e.target.value } })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="">Select Brand</option>
                                {brands.map((brand) => (
                                  <option key={brand._id} value={brand._id}>
                                    {brand.nameEn} {brand.nameAr && `(${brand.nameAr})`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.assignBrand?.nameEn || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingItem === item._id ? (
                              <div className="space-y-1">
                                {branches.map((branch) => (
                                  <label key={branch._id} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={editFormData.assignBranch?.includes(branch._id) || false}
                                      onChange={(e) => {
                                        const newBranches = e.target.checked
                                          ? [...(editFormData.assignBranch || []), branch._id]
                                          : (editFormData.assignBranch || []).filter(id => id !== branch._id);
                                        handleEditInputChange({ target: { name: 'assignBranch', value: newBranches } });
                                      }}
                                      className="mr-2"
                                    />
                                    {branch.name}
                                  </label>
                                ))}
                              </div>
                            ) : (
                              // Display branches - handle both single and multiple
                              Array.isArray(item.assignBranch) 
                                ? item.assignBranch.map(branch => branch.name).join(', ') || '-'
                                : item.assignBranch?.name || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingItem === item._id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(item._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {items.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items found. Create your first item above!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateItem; 