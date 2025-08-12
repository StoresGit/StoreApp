import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import ResponsiveModal from '../../components/ResponsiveModal';

const Items = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAlt: '',
    category: '',
    subCategory: '',
    baseUnit: '',
    unit: '',
    unitPrice: '',
    tax: '',
    assignBranch: '',
    assignBrand: '',
    departments: [],
    priceIncludesVAT: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to access this page');
        setLoading(false);
        return;
      }

      // Fetch data with individual error handling for each endpoint
      const fetchWithErrorHandling = async (apiCall, defaultValue = []) => {
        try {
          const response = await apiCall();
          return response.data || defaultValue;
        } catch (error) {
          console.warn('Failed to fetch data:', error.message);
          return defaultValue;
        }
      };

      // Fetch all data in parallel with error handling
      const [
        items,
        categories,
        subCategories,
        units,
        taxes,
        branches,
        brands,
        departments
      ] = await Promise.all([
        fetchWithErrorHandling(apiService.items.getAll),
        fetchWithErrorHandling(apiService.itemCategories.getAll),
        fetchWithErrorHandling(apiService.subCategories.getAll),
        fetchWithErrorHandling(apiService.units.getAll),
        fetchWithErrorHandling(apiService.taxes.getAll),
        fetchWithErrorHandling(apiService.branches.getAll),
        fetchWithErrorHandling(apiService.brands.getAll),
        fetchWithErrorHandling(apiService.departments.getAll)
      ]);

      setItems(items);
      setCategories(categories);
      setSubCategories(subCategories);
      setUnits(units);
      setTaxes(taxes);
      setBranches(branches);
      setBrands(brands);
      setDepartments(departments);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.status >= 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Error loading data. Please refresh the page.');
      }
      
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nameEn: item.nameEn || '',
      nameAlt: item.nameAlt || '',
      category: item.category?._id || '',
      subCategory: item.subCategory?._id || '',
      baseUnit: item.baseUnit?._id || '',
      unit: item.unit?._id || '',
      unitPrice: item.unitPrice || '',
      tax: item.tax?._id || '',
      assignBranch: item.assignBranch?._id || '',
      assignBrand: item.assignBrand?._id || '',
      departments: item.departments?.map(dept => dept._id) || [],
      priceIncludesVAT: item.priceIncludesVAT || false
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiService.items.delete(itemId);
        alert('Item deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDepartmentChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      departments: checked
        ? [...prev.departments, value]
        : prev.departments.filter(id => id !== value)
    }));
  };

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAlt: '',
      category: '',
      subCategory: '',
      baseUnit: '',
      unit: '',
      unitPrice: '',
      tax: '',
      assignBranch: '',
      assignBrand: '',
      departments: [],
      priceIncludesVAT: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await apiService.items.update(editingItem._id, formData);
        alert('Item updated successfully');
      } else {
        await apiService.items.create(formData);
        alert('Item created successfully');
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const navigateToCreateItem = () => {
    navigate('/branch-settings/create-item');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Item List</h1>
            <p className="text-gray-600">Manage all items in the system</p>
          </div>
          <button
            onClick={navigateToCreateItem}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            Create New Item
          </button>
        </div>

        {/* Items Table */}
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
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
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
                    <span className="ml-1 text-gray-900">{item.subCategory?.nameEn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <span className="ml-1 text-gray-900">{item.unit?.name || item.baseUnit?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 text-gray-900">{item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No items found. Create your first item!</p>
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
                    Name (Alternative)
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
                    Unit Price
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
                      {item.nameEn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nameAlt || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category?.nameEn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.subCategory?.nameEn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unit?.name || item.baseUnit?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-900"
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
          
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No items found. Create your first item!</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Item' : 'Create New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Alternative)
              </label>
              <input
                type="text"
                name="nameAlt"
                value={formData.nameAlt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category *
              </label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Sub Category</option>
                {subCategories.map(subCategory => (
                  <option key={subCategory._id} value={subCategory._id}>
                    {subCategory.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Unit *
              </label>
              <select
                name="baseUnit"
                value={formData.baseUnit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Base Unit</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax
              </label>
              <select
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tax</option>
                {taxes.map(tax => (
                  <option key={tax._id} value={tax._id}>
                    {tax.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Branch
              </label>
              <select
                name="assignBranch"
                value={formData.assignBranch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Brand
              </label>
              <select
                name="assignBrand"
                value={formData.assignBrand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departments
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {departments.map(department => (
                <label key={department._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={department._id}
                    checked={formData.departments.includes(department._id)}
                    onChange={handleDepartmentChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{department.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="priceIncludesVAT"
                checked={formData.priceIncludesVAT}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Price includes VAT</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingItem(null);
                resetForm();
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingItem ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default Items;
