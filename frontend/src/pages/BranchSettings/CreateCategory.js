import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const CreateCategory = () => {
  const [formData, setFormData] = useState({
    mainCategoryName: ''
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState({
    subCategoryName: ''
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/item-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (parentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/item-categories/subcategories/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.mainCategoryName.trim()) {
      try {
        setError('');
        const token = localStorage.getItem('token');
        const categoryData = {
          nameEn: formData.mainCategoryName.trim(),
          nameUr: '' // Empty for main categories
        };

        if (editingCategory) {
          // Update existing category
          await axios.put(`${backend_url}/item-categories/${editingCategory._id}`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEditingCategory(null);
          setSuccess('Category updated successfully!');
        } else {
          // Create new category
          await axios.post(`${backend_url}/item-categories`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSuccess('Category created successfully!');
        }

        // Reset form and refresh categories
        setFormData({
          mainCategoryName: ''
        });
        fetchCategories();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error creating/updating category:', error);
        setError(error.response?.data?.error || 'Failed to save category. Please try again.');
      }
    } else {
      setError('Please enter a category name');
    }
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    if (subCategoryFormData.subCategoryName.trim() && selectedParentCategory) {
      try {
        setSubCategoryLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        // Create sub-category with parent relationship
        const subCategoryData = {
          nameEn: subCategoryFormData.subCategoryName.trim(),
          nameUr: subCategoryFormData.subCategoryName.trim(),
          parentId: selectedParentCategory._id
        };

        await axios.post(`${backend_url}/item-categories`, subCategoryData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess('Sub-category created successfully!');
        fetchCategories();
        closeSubCategoryModal();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error creating sub-category:', error);
        setError(error.response?.data?.error || 'Failed to create sub-category. Please try again.');
      } finally {
        setSubCategoryLoading(false);
      }
    } else {
      setError('Please enter a sub-category name');
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      mainCategoryName: category.nameEn || category.name || ''
    });
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      mainCategoryName: ''
    });
    setError('');
    setSuccess('');
  };

  const deleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all its sub-categories.')) {
      try {
        setError('');
        const token = localStorage.getItem('token');
        await axios.delete(`${backend_url}/item-categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Category deleted successfully!');
        fetchCategories(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Failed to delete category. Please try again.');
      }
    }
  };

  const toggleExpanded = async (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const openSubCategoryModal = (parentCategory) => {
    setSelectedParentCategory(parentCategory);
    setSubCategoryFormData({ subCategoryName: '' });
    setShowSubCategoryModal(true);
    setError('');
  };

  const closeSubCategoryModal = () => {
    setShowSubCategoryModal(false);
    setSelectedParentCategory(null);
    setSubCategoryFormData({ subCategoryName: '' });
    setError('');
  };

  const renderSubCategories = async (parentId) => {
    const subCategories = await fetchSubCategories(parentId);
    return subCategories.map(subCat => (
      <div key={subCat._id} className="ml-8 border-l-2 border-gray-200 pl-4 py-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-600 text-sm">
            {subCat.nameEn || subCat.name}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => editCategory(subCat)}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="Edit sub-category"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => deleteCategory(subCat._id)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete sub-category"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Create Category Section */}
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Item Categories</h1>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mb-8">
          {/* Main Category Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Category Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="mainCategoryName"
                value={formData.mainCategoryName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            {editingCategory && (
              <button 
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>

        {/* Item Categories Table */}
        <div className="mt-8">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold text-gray-700 text-sm uppercase tracking-wider">ITEM CATEGORY NAME</div>
                <div className="font-semibold text-gray-700 text-sm uppercase tracking-wider">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category._id}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="font-medium text-gray-800">
                        {category.nameEn || category.name}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Expand/Collapse Icon */}
                        <button
                          onClick={() => toggleExpanded(category._id)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title={expandedCategories.has(category._id) ? "Collapse" : "Expand"}
                        >
                          {expandedCategories.has(category._id) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => editCategory(category)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Add Sub-category Button */}
                        <button
                          onClick={() => openSubCategoryModal(category)}
                          className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-green-600 transition-colors"
                          title="Add sub-category"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteCategory(category._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Sub-categories Section */}
                  {expandedCategories.has(category._id) && (
                    <div className="bg-gray-50 px-6 py-2 border-t border-gray-200">
                      <SubCategoriesList 
                        parentId={category._id} 
                        onEdit={editCategory}
                        onDelete={deleteCategory}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Category Modal */}
      {showSubCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Sub-Category
              </h3>
              <button
                onClick={closeSubCategoryModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedParentCategory && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Parent Category:</span> {selectedParentCategory.nameEn || selectedParentCategory.name}
                </p>
              </div>
            )}

            <form onSubmit={handleSubCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Category Name *
                </label>
                <input
                  type="text"
                  name="subCategoryName"
                  value={subCategoryFormData.subCategoryName}
                  onChange={handleSubCategoryInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter sub-category name"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeSubCategoryModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subCategoryLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {subCategoryLoading ? 'Creating...' : 'Create Sub-Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for rendering sub-categories
const SubCategoriesList = ({ parentId, onEdit, onDelete }) => {
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backend_url}/item-categories/subcategories/${parentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubCategories(response.data);
      } catch (error) {
        console.error('Error fetching sub-categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategories();
  }, [parentId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading sub-categories...</div>;
  }

  if (subCategories.length === 0) {
    return <div className="text-sm text-gray-500">No sub-categories found</div>;
  }

  return (
    <div className="space-y-2">
      {subCategories.map(subCat => (
        <div key={subCat._id} className="ml-4 border-l-2 border-gray-200 pl-4 py-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-600 text-sm">
              {subCat.nameEn || subCat.name}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(subCat)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Edit sub-category"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(subCat._id)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Delete sub-category"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreateCategory; 