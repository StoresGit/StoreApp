import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';
import { useNavigate } from 'react-router-dom';
import { fetchMultipleEndpoints } from '../services/api';
import ResponsiveTable from '../components/ResponsiveTable';
import ResponsiveModal, { ConfirmationModal, ImageModal } from '../components/ResponsiveModal';
import ResponsiveForm, { FormField, FormInput, FormSelect, FormCheckbox, FormGrid } from '../components/ResponsiveForm';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading items data...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
    setSearchQuery(query);
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      setFormLoading(true);
      
      const submitData = {
        ...formData,
        name: formData.nameEn // Keep backward compatibility
      };

      if (editingId) {
        await axios.put(`${backend_url}/items/${editingId}`, submitData);
      } else {
        await axios.post(`${backend_url}/items`, submitData);
      }

      // Reset form and close modal
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
      setShowFormModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setFormLoading(false);
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
      departments: item.departments?.map(dep => dep._id) || [],
      name: item.name || '',
      subCategory: item.subCategory?._id || ''
    });
    setEditingId(item._id);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${backend_url}/items/${deleteItemId}`);
      
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
    } finally {
      setShowDeleteModal(false);
      setDeleteItemId(null);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'itemCode',
      header: 'Item Code',
      sortable: true,
      render: (item) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-mono">
          {item.itemCode || 'Generating...'}
        </span>
      )
    },
    {
      key: 'nameEn',
      header: 'Item Name (Eng)',
      sortable: true,
      render: (item) => item.nameEn || item.name
    },
    {
      key: 'nameAlt',
      header: 'Item Name (Alt)',
      sortable: true,
      render: (item) => item.nameAlt || 'N/A'
    },
    {
      key: 'baseUnit',
      header: 'Base Unit',
      sortable: true,
      render: (item) => (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
          {item.baseUnit?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Main Category',
      sortable: true,
      render: (item) => item.category?.nameEn || 'N/A'
    },
    {
      key: 'subCategory',
      header: 'Sub Category',
      sortable: true,
      render: (item) => item.subCategory?.nameEn || 'N/A'
    },
    {
      key: 'tax',
      header: 'Tax',
      sortable: true,
      render: (item) => item.tax?.name || 'N/A'
    },
    {
      key: 'image',
      header: 'Image',
      render: (item) => (
        item.image?.url ? (
          <img 
            src={item.image.url} 
            alt="Item"
            className="w-12 h-12 object-cover mx-auto rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            onClick={() => handleImageClick(item.image.url)}
          />
        ) : (
          <span className="text-gray-500 text-sm">No image</span>
        )
      )
    }
  ];

  // Custom actions for table
  const customActions = [
    {
      icon: '📋',
      title: 'Details',
      onClick: (item) => navigate(`/items/${item._id}/edit`),
      className: 'text-blue-600 hover:text-blue-800'
    }
  ];

  // Mobile card render function
  const mobileCardRender = (item, index) => (
    <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.nameEn || item.name}</h3>
          <p className="text-sm text-gray-500">{item.nameAlt || 'No alternative name'}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-mono">
          {item.itemCode || 'Generating...'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Base Unit</p>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            {item.baseUnit?.name || 'N/A'}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tax</p>
          <p className="text-sm font-medium">{item.tax?.name || 'N/A'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="text-sm font-medium">{item.category?.nameEn || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Sub Category</p>
          <p className="text-sm font-medium">{item.subCategory?.nameEn || 'N/A'}</p>
        </div>
      </div>
      
      {item.image?.url && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Image</p>
          <img 
            src={item.image.url} 
            alt="Item"
            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            onClick={() => handleImageClick(item.image.url)}
          />
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate(`/items/${item._id}/edit`)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded"
          title="Details"
        >
          📋
        </button>
        <button
          onClick={() => handleEdit(item)}
          className="text-green-600 hover:text-green-800 p-1 rounded"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(item._id)}
          className="text-red-600 hover:text-red-800 p-1 rounded"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment due to server rate limiting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Items</h1>
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Item
        </button>
      </div>

      {/* Items Table */}
      <ResponsiveTable
        title="Items Management"
        columns={columns}
        data={searchQuery ? searchResults : items}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={customActions}
        loading={loading}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        mobileCardRender={mobileCardRender}
      />

      {/* Form Modal */}
      <ResponsiveModal
        isOpen={showFormModal}
        onClose={() => {
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
        title={editingId ? 'Edit Item' : 'Add Item'}
        size="lg"
      >
        <ResponsiveForm
          onSubmit={handleSubmit}
          loading={formLoading}
          submitText={editingId ? 'Update Item' : 'Add Item'}
        >
          <FormGrid cols={2}>
            <FormField label="Item Name (English)" required>
              <FormInput
                name="nameEn"
                value={formData.nameEn}
                onChange={handleChange}
                placeholder="Enter item name in English"
                required
              />
            </FormField>

            <FormField label="Item Name (Alternative)">
              <FormInput
                name="nameAlt"
                value={formData.nameAlt}
                onChange={handleChange}
                placeholder="Enter alternative name"
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField label="Base Unit" required>
              <FormSelect
                name="baseUnit"
                value={formData.baseUnit}
                onChange={handleChange}
                required
              >
                <option value="">Select Base Unit</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label="Tax">
              <FormSelect
                name="tax"
                value={formData.tax}
                onChange={handleChange}
              >
                <option value="">Select Tax</option>
                {taxes.map(tax => (
                  <option key={tax._id} value={tax._id}>
                    {tax.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField label="Main Category" required>
              <FormSelect
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.nameEn}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label="Sub Category" required>
              <FormSelect
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                required
              >
                <option value="">Select Sub Category</option>
                {filteredSubCategories.map(subCategory => (
                  <option key={subCategory._id} value={subCategory._id}>
                    {subCategory.nameEn}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </FormGrid>

          <FormField label="Image">
            <FormSelect
              name="image"
              value={formData.image}
              onChange={handleChange}
            >
              <option value="">Select Image</option>
              {images.map(image => (
                <option key={image._id} value={image._id}>
                  {image.originalName}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Departments">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {departments.map(department => (
                <FormCheckbox
                  key={department._id}
                  checked={formData.departments.includes(department._id)}
                  onChange={() => handleDepartmentToggle(department._id)}
                  label={department.nameEn}
                />
              ))}
            </div>
          </FormField>
        </ResponsiveForm>
      </ResponsiveModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This will also delete all associated packaging for this item."
        type="danger"
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={selectedImage}
        imageAlt="Item Image"
      />
    </div>
  );
};

export default Item;
