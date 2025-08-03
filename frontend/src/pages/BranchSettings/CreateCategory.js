import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const CreateCategory = () => {
  const [formData, setFormData] = useState({
    mainCategoryName: '',
    subCategoryName: ''
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/item-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.mainCategoryName && formData.subCategoryName) {
      try {
        const token = localStorage.getItem('token');
        const categoryData = {
          nameEn: formData.mainCategoryName, // Use nameEn field
          nameUr: formData.subCategoryName // Use nameUr for subcategory
        };

        if (editingCategory) {
          // Update existing category
          await axios.put(`${backend_url}/item-categories/${editingCategory._id}`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEditingCategory(null);
        } else {
          // Create new category
          await axios.post(`${backend_url}/item-categories`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Reset form and refresh categories
        setFormData({
          mainCategoryName: '',
          subCategoryName: ''
        });
        fetchCategories();
        
        // Show success message
        alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      } catch (error) {
        console.error('Error creating/updating category:', error);
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      mainCategoryName: category.nameEn || '',
      subCategoryName: category.nameUr || ''
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      mainCategoryName: '',
      subCategoryName: ''
    });
  };

  const deleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${backend_url}/item-categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories(); // Refresh the list
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
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
          <h1 className="text-2xl font-bold text-black">Branch Category</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* Main Category Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Main Category Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="mainCategoryName"
                value={formData.mainCategoryName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter main category name"
                required
              />
            </div>
          </div>

          {/* Sub Category Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Sub Category Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="subCategoryName"
                value={formData.subCategoryName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter sub category name"
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

        {/* Item Categories List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Item Categories</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold text-gray-700">ITEM CATEGORY NAME</div>
                <div className="font-semibold text-gray-700">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category._id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="font-medium text-gray-800">{category.nameEn || category.name}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editCategory(category)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit category"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteCategory(category._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete category"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory; 