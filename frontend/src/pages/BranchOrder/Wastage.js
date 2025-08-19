import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';

const Wastage = () => {
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wastageList, setWastageList] = useState([]);
  const [wastageLoading, setWastageLoading] = useState(true);
  
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

  // Use ref to track current section without creating dependency
  const currentSectionRef = useRef(formData.section);

  // Update ref when formData.section changes
  useEffect(() => {
    currentSectionRef.current = formData.section;
  }, [formData.section]);

  useEffect(() => {
    fetchData();
    fetchWastageList();
  }, []);

  // Filter sections based on selected branch
  useEffect(() => {
    if (formData.branch) {
      console.log('Selected branch ID:', formData.branch);
      console.log('All sections:', sections);
      
      // Filter sections that belong to the selected branch
      const branchSections = sections.filter(section => {
        // Check multiple possible field names and data structures
        const sectionBranch = section.branch;
        const sectionBranchId = section.branchId;
        const sectionBranches = section.branches;
        
        console.log('Section:', section.name, 'Branch fields:', {
          branch: sectionBranch,
          branchId: sectionBranchId,
          branches: sectionBranches
        });
        
        // Check if section belongs to the selected branch
        if (sectionBranch === formData.branch) {
          console.log('Match found: direct branch reference');
          return true;
        }
        
        if (sectionBranchId === formData.branch) {
          console.log('Match found: branchId reference');
          return true;
        }
        
        if (Array.isArray(sectionBranches) && sectionBranches.includes(formData.branch)) {
          console.log('Match found: branches array');
          return true;
        }
        
        // Check if section has a branch object with _id
        if (sectionBranch && typeof sectionBranch === 'object' && sectionBranch._id === formData.branch) {
          console.log('Match found: branch object with _id');
          return true;
        }
        
        // Check if section has a branchId object with _id
        if (sectionBranchId && typeof sectionBranchId === 'object' && sectionBranchId._id === formData.branch) {
          console.log('Match found: branchId object with _id');
          return true;
        }
        
        return false;
      });
      
      console.log('Filtered sections for branch:', branchSections);
      setFilteredSections(branchSections);
      
      // Clear section selection if current section is not available for selected branch
      if (!branchSections.find(s => s._id === currentSectionRef.current)) {
        console.log('Clearing section selection - current section not available for selected branch');
        setFormData(prev => ({ ...prev, section: '' }));
      }
    } else {
      // If no branch is selected, show all sections
      console.log('No branch selected - showing all sections');
      setFilteredSections(sections);
      setFormData(prev => ({ ...prev, section: '' }));
    }
  }, [formData.branch, sections]);

  // Filter items based on selected branch and section
  const getFilteredItems = () => {
    if (!formData.branch && !formData.section) {
      return items; // Show all items if no branch or section selected
    }

    return items.filter(item => {
      let matchesBranch = false;
      let matchesSection = false;

      // Check branch matching
      if (formData.branch) {
        // Check assignBranch array
        if (Array.isArray(item.assignBranch) && item.assignBranch.some(branch => {
          if (typeof branch === 'string') return branch === formData.branch;
          if (typeof branch === 'object' && branch) return branch._id === formData.branch;
          return false;
        })) {
          matchesBranch = true;
        }
        // Check legacy branch field
        else if (item.branch && item.branch._id === formData.branch) {
          matchesBranch = true;
        }
        // Check legacy branches array
        else if (Array.isArray(item.branches) && item.branches.some(branch => {
          if (typeof branch === 'string') return branch === formData.branch;
          if (typeof branch === 'object' && branch) return branch._id === formData.branch;
          return false;
        })) {
          matchesBranch = true;
        }
      } else {
        matchesBranch = true; // No branch filter applied
      }

      // Check section matching
      if (formData.section) {
        if (item.assignSection && item.assignSection._id === formData.section) {
          matchesSection = true;
        } else if (item.section && item.section._id === formData.section) {
          matchesSection = true;
        } else if (item.sectionId && item.sectionId === formData.section) {
          matchesSection = true;
        }
      } else {
        matchesSection = true; // No section filter applied
      }

      return matchesBranch && matchesSection;
    });
  };

  const filteredItems = getFilteredItems();

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
      const sectionsResponse = await apiService.sections.getActive();
      console.log('Sections response:', sectionsResponse);
      setSections(sectionsResponse.data || []);
      setFilteredSections(sectionsResponse.data || []);

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

  // Fetch wastage records
  const fetchWastageList = async () => {
    try {
      setWastageLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setWastageLoading(false);
        return;
      }

      const response = await apiService.wastage.getAll();
      console.log('Fetched wastage records:', response);
      console.log('Response structure:', {
        hasResponse: !!response,
        hasData: !!(response && response.data),
        dataType: response && response.data ? typeof response.data : 'undefined',
        isArray: response && response.data ? Array.isArray(response.data) : false,
        dataKeys: response && response.data ? Object.keys(response.data) : []
      });
      
      // Handle different response structures
      let wastageData = [];
      if (response && response.data) {
        // Backend returns { success: true, data: wastageRecords }
        if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
          wastageData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          wastageData = response.data.data;
        } else if (Array.isArray(response.data)) {
          wastageData = response.data;
        }
      }
      
      console.log('Processed wastage data:', wastageData);
      setWastageList(wastageData);
    } catch (error) {
      console.error('Error fetching wastage records:', error);
      setWastageList([]);
    } finally {
      setWastageLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill item code and unit when item is selected
    if (name === 'itemName') {
      console.log('Item selected:', value);
      console.log('Available items:', filteredItems);
      
      const selectedItem = filteredItems.find(item => item._id === value);
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
        
        // Refresh wastage list
        fetchWastageList();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              Wastage Management
            </h1>
            <p className="text-blue-100">Track and manage wastage records efficiently</p>
          </div>
        </div>

        {/* Wastage Form - Grid Layout */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg backdrop-blur-sm bg-white/90">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-xl p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Wastage Record
            </h2>
          </div>
          <form onSubmit={handleSubmit}>
            {/* General Information Section */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {/* Left Column */}
              <div className="space-y-0">
                 <div className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                   <div className="w-1/3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-200 flex items-center">
                     <label className="text-sm font-medium text-gray-700 flex items-center">
                       <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                       </svg>
                       Select Branch
                     </label>
                  </div>
                   <div className="w-2/3 p-4">
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                       className="w-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-700 transition-all duration-200"
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
                
                                 <div className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                   <div className="w-1/3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-r border-gray-200 flex items-center">
                     <label className="text-sm font-medium text-gray-700 flex items-center">
                       <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                       </svg>
                       Event Date
                     </label>
                  </div>
                   <div className="w-2/3 p-4">
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                       className="w-full border-0 focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent text-gray-700 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-0">
                 <div className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                   <div className="w-1/3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-r border-gray-200 flex items-center">
                     <label className="text-sm font-medium text-gray-700 flex items-center">
                       <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                       </svg>
                       Select Section
                     </label>
                  </div>
                   <div className="w-2/3 p-4">
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                       className="w-full border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent text-gray-700 transition-all duration-200 disabled:opacity-50"
                      disabled={!formData.branch}
                      required
                    >
                      <option value="">
                        {formData.branch ? 'Select Section' : 'Select Branch First'}
                      </option>
                      {filteredSections.map(section => (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                    {formData.branch && filteredSections.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No sections available for this branch</p>
                    )}
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
                  <label className="text-sm font-medium text-gray-700">Item Code</label>
                </div>
                <div className="p-3 border-r border-gray-300">
                   <label className="text-sm font-medium text-gray-700">
                     Item Name 
                     {formData.branch && formData.section && (
                       <span className="ml-2 text-xs text-gray-500">
                         ({filteredItems.length} available)
                       </span>
                     )}
                   </label>
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
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    readOnly
                    className="w-full border-0 focus:outline-none bg-transparent text-gray-500"
                  />
                </div>
                
                <div className="p-3 border-r border-gray-300">
                  <select
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                    required
                  >
                                         <option value="">
                       {formData.branch && formData.section 
                         ? (filteredItems.length > 0 ? 'Select Item' : 'No items available for this branch/section')
                         : 'Select Branch and Section First'
                       }
                     </option>
                     {filteredItems.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.nameEn || item.name}
                      </option>
                    ))}
                  </select>
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

        {/* Wastage List Section */}
        <div className="mt-8">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-300">
              <div className="flex justify-between items-center">
                <div>
              <h2 className="text-lg font-semibold text-gray-900">Wastage Records</h2>
              <p className="text-sm text-gray-600 mt-1">Showing {Array.isArray(wastageList) ? wastageList.length : 0} records</p>
                </div>
                <button
                  onClick={() => {
                    console.log('Current wastage list:', wastageList);
                    console.log('Wastage list length:', wastageList.length);
                    console.log('Is array:', Array.isArray(wastageList));
                    fetchWastageList();
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Debug: Refresh
                </button>
              </div>
            </div>
            
            {wastageLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading wastage records...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch & Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wastage Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Media
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(wastageList) && wastageList.map((wastage) => (
                      <tr key={wastage._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{wastage.eventName}</div>
                            <div className="text-sm text-gray-500">{new Date(wastage.eventDate).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(wastage.branches) && wastage.branches.length > 0 
                              ? (wastage.branches[0]?.name || wastage.branches[0] || '-')
                              : '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {wastage.section?.name || wastage.section || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {wastage.itemName?.nameEn || wastage.itemName?.name || wastage.itemName || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {wastage.itemCode || '-'} • {wastage.qty || 0} {wastage.unit || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {wastage.wastageType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {wastage.media ? (
                            <img 
                              src={wastage.media} 
                              alt="Wastage" 
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-400">No image</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(!Array.isArray(wastageList) || wastageList.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No wastage records found</p>
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

export default Wastage; 