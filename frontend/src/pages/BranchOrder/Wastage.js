import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const Wastage = () => {
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    branch: '', // Changed from branches array to single branch string
    section: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventName: '',
    media: null,
    itemName: '',
    itemCode: '',
    unit: '',
    qty: '',
    wastageType: ''
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

      console.log('Fetching data with token:', token ? 'Token exists' : 'No token');

      // Fetch branches from the correct endpoint
      console.log('Fetching branches...');
      const branchesResponse = await apiService.branches.getAll();
      console.log('Branches response:', branchesResponse);
      setBranches(branchesResponse.data || []);

      // Fetch sections
      console.log('Fetching sections...');
      const sectionsResponse = await apiService.sections.getAll();
      console.log('Sections response:', sectionsResponse);
      setSections(sectionsResponse.data || []);

      // Fetch items from the correct endpoint
      console.log('Fetching items...');
      const itemsResponse = await apiService.items.getAll();
      console.log('Items response:', itemsResponse);
      setItems(itemsResponse.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else if (error.response?.status >= 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Error loading data. Please refresh the page.');
      }
      
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill item code and unit when item is selected
    if (name === 'itemName') {
      console.log('Item selected:', value);
      console.log('Available items:', items);
      
      const selectedItem = items.find(item => item._id === value);
      console.log('Selected item:', selectedItem);
      
      if (selectedItem) {
        // Item code - try different possible field names
        const itemCode = selectedItem.itemCode || selectedItem.code || selectedItem.nameEn || selectedItem.name || '';
        
        // Unit - check for populated unit objects first, then fallback to string fields
        let unit = '';
        if (selectedItem.unit && selectedItem.unit.name) {
          unit = selectedItem.unit.name;
        } else if (selectedItem.baseUnit && selectedItem.baseUnit.name) {
          unit = selectedItem.baseUnit.name;
        } else if (selectedItem.unit) {
          unit = selectedItem.unit;
        } else if (selectedItem.baseUnit) {
          unit = selectedItem.baseUnit;
        } else {
          // Fallback to string fields
          unit = selectedItem.unitType || selectedItem.unitName || '';
        }
        
        console.log('Auto-filling - Item Code:', itemCode, 'Unit:', unit);
        console.log('Unit object:', selectedItem.unit);
        console.log('Base Unit object:', selectedItem.baseUnit);
        
        setFormData(prev => ({
          ...prev,
          itemCode: itemCode,
          unit: unit
        }));
      } else {
        // Clear the fields if no item is selected
        setFormData(prev => ({
          ...prev,
          itemCode: '',
          unit: ''
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, media: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('branch', formData.branch); // Changed from branches array to single branch
      submitData.append('section', formData.section);
      submitData.append('eventDate', formData.eventDate);
      submitData.append('eventName', formData.eventName);
      submitData.append('itemName', formData.itemName);
      submitData.append('itemCode', formData.itemCode);
      submitData.append('unit', formData.unit);
      submitData.append('qty', formData.qty);
      submitData.append('wastageType', formData.wastageType);
      
      if (formData.media) {
        submitData.append('media', formData.media);
      }

      console.log('Submitting wastage data:', formData);
      
      // Submit to backend API
      const response = await apiService.wastage.create(submitData);
      
      console.log('Wastage submission response:', response);
      
      // Check if response exists and has success property
      if (response && response.data && response.data.success) {
        alert('Wastage record created successfully!');
        
        // Reset form
        setFormData({
          branch: '', // Reset to empty string
          section: '',
          eventDate: new Date().toISOString().split('T')[0],
          eventName: '',
          media: null,
          itemName: '',
          itemCode: '',
          unit: '',
          qty: '',
          wastageType: ''
        });
      } else {
        console.error('Unexpected response format:', response);
        alert('Error: Unexpected response from server');
      }
    } catch (error) {
      console.error('Error submitting wastage:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Server error occurred';
        alert(`Error: ${errorMessage}`);
      } else if (error.request) {
        // Network error
        alert('Error: Network connection failed. Please check your internet connection.');
      } else {
        // Other error
        alert(`Error: ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Wastage</h1>
        </div>

        {/* Wastage Form - Grid Layout */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit}>
            {/* General Information Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-gray-300">
              {/* Left Column */}
              <div className="space-y-0">
                <div className="flex border-b border-gray-300">
                  <div className="w-1/3 p-3 bg-gray-50 border-r border-gray-300 flex items-center">
                    <label className="text-sm font-medium text-gray-700">Select Branch</label>
                  </div>
                  <div className="w-2/3 p-3">
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex border-b border-gray-300">
                  <div className="w-1/3 p-3 bg-gray-50 border-r border-gray-300 flex items-center">
                    <label className="text-sm font-medium text-gray-700">Event Date</label>
                  </div>
                  <div className="w-2/3 p-3">
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-0">
                <div className="flex border-b border-gray-300">
                  <div className="w-1/3 p-3 bg-gray-50 border-r border-gray-300 flex items-center">
                    <label className="text-sm font-medium text-gray-700">Select Section</label>
                  </div>
                  <div className="w-2/3 p-3">
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex border-b border-gray-300">
                  <div className="w-1/3 p-3 bg-gray-50 border-r border-gray-300 flex items-center">
                    <label className="text-sm font-medium text-gray-700">Event Name</label>
                  </div>
                  <div className="w-2/3 p-3">
                    <input
                      type="text"
                      name="eventName"
                      value={formData.eventName}
                      onChange={handleInputChange}
                      className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 p-3 bg-gray-50 border-r border-gray-300 flex items-center">
                    <label className="text-sm font-medium text-gray-700">Media</label>
                  </div>
                  <div className="w-2/3 p-3">
                    <input
                      type="file"
                      name="media"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent file:border-0 file:bg-transparent file:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Item Wastage Details Section */}
            <div className="border-b border-gray-300">
              {/* Headers */}
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-300">
                <div className="p-3 border-r border-gray-300">
                  <label className="text-sm font-medium text-gray-700">Item Name</label>
                </div>
                <div className="p-3 border-r border-gray-300">
                  <label className="text-sm font-medium text-gray-700">Item Code</label>
                </div>
                <div className="p-3 border-r border-gray-300">
                  <label className="text-sm font-medium text-gray-700">Unit</label>
                </div>
                <div className="p-3 border-r border-gray-300">
                  <label className="text-sm font-medium text-gray-700">Qty</label>
                </div>
                <div className="p-3">
                  <label className="text-sm font-medium text-gray-700">Wastage Type</label>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-5">
                <div className="p-3 border-r border-gray-300">
                  <select
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
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
                
                <div className="p-3 border-r border-gray-300">
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    readOnly
                    className="w-full border-0 focus:outline-none bg-transparent text-gray-500"
                  />
                </div>
                
                <div className="p-3 border-r border-gray-300">
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    readOnly
                    className="w-full border-0 focus:outline-none bg-transparent text-gray-500"
                  />
                </div>
                
                <div className="p-3 border-r border-gray-300">
                  <input
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                
                <div className="p-3">
                  <select
                    name="wastageType"
                    value={formData.wastageType}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Expired">Expired</option>
                    <option value="Unsold">Unsold</option>
                    <option value="Spill Over">Spill Over</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
              >
                Submit Wastage
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Wastage; 