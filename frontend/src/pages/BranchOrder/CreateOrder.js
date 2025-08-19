import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';
import { MasterAdminOnly } from '../../components/PermissionGuard';
import { useAuth } from '../../context/AuthContext';

const ORDER_TYPES = ['Urgent', 'Routine', 'Schedule'];

const CreateOrder = () => {
  const { user } = useAuth();

  // Step-by-step selection state
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Order form state (for modal)
  const [orderType, setOrderType] = useState('Urgent');
  const [orderStatus] = useState('Draft');
  const [orderNo, setOrderNo] = useState('');
  const [dateTime] = useState(new Date());
  const [scheduleDate, setScheduleDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [selectedItems, setSelectedItems] = useState({});

  // Data state
  const [allBranches, setAllBranches] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('');
  const [branchSearchTerm, setBranchSearchTerm] = useState('');

  // Subcategory selection modal state
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedItemForSubCategory, setSelectedItemForSubCategory] = useState(null);
  const [subCategoriesForModal, setSubCategoriesForModal] = useState([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [allSubCategories, setAllSubCategories] = useState([]);

  const generateOrderNo = () => {
    const now = new Date();
    return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
  };

  // Function to fetch subcategories for a specific category
  const fetchSubCategoriesForCategory = async (categoryId) => {
    try {
      setLoadingSubCategories(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${backend_url}/item-categories/subcategories/${categoryId}`, { headers });
      console.log('Fetched subcategories for category:', categoryId, response.data);
      
      // Store subcategories globally
      setAllSubCategories(prev => {
        const existing = prev.filter(sub => sub.category !== categoryId);
        return [...existing, ...response.data];
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching subcategories for category:', categoryId, error);
      return [];
    } finally {
      setLoadingSubCategories(false);
    }
  };

  // Function to fetch all subcategories
  const fetchAllSubCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Get all categories first
      const categoriesResponse = await axios.get(`${backend_url}/item-categories`, { headers });
      const categories = categoriesResponse.data || [];
      
      // Fetch subcategories for each category
      const allSubs = [];
      for (const category of categories) {
        if (category._id) {
          try {
            const subResponse = await axios.get(`${backend_url}/item-categories/subcategories/${category._id}`, { headers });
            allSubs.push(...(subResponse.data || []));
          } catch (error) {
            console.error('Error fetching subcategories for category:', category._id, error);
          }
        }
      }
      
      setAllSubCategories(allSubs);
      console.log('Loaded all subcategories:', allSubs);
    } catch (error) {
      console.error('Error fetching all subcategories:', error);
    }
  };

  // Fetch reference data
  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [itemsRes, branchesRes, categoriesRes, sectionsRes] = await Promise.all([
          axios.get(`${backend_url}/items`, { headers }).catch((error) => {
            console.error('Error fetching items:', error);
            return { data: [] };
          }),
          axios.get(`${backend_url}/branch`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/item-categories`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/sections`, { headers }).catch(() => ({ data: [] })),
        ]);
        
        console.log('API Responses:', {
          items: itemsRes.data,
          branches: branchesRes.data,
          categories: categoriesRes.data,
          sections: sectionsRes.data
        });
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data.filter(item => item && item._id && typeof item === 'object') : []);
        setAllBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        setAllSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data.filter(cat => cat && cat._id) : []);
        
        // Fetch all subcategories
        await fetchAllSubCategories();
        
        // Debug logging
        console.log('Loaded categories:', categoriesRes.data);
        console.log('Loaded sections:', sectionsRes.data);
      } catch (e) {
        console.error('Failed to load required data:', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);



  // Generate order number when modal opens
  useEffect(() => {
    if (showOrderModal) {
      setOrderNo(generateOrderNo());
      console.log('Modal opened - Items state:', {
        allItems: allItems.length,
        selectedBranch: selectedBranch?.name,
        categoriesCount: categories.length
      });
    }
  }, [showOrderModal, allItems.length, selectedBranch, categories.length]);



  // Filter items based on search, branch, and section
  const filteredItems = useMemo(() => {
    const filtered = allItems.filter(item => {
      // Add null check for item
      if (!item) return false;
      
      // Branch filter - only show items from selected branch
      const matchesBranch = !selectedBranch || 
        // Handle single branch assignment
        (item.assignBranch && !Array.isArray(item.assignBranch) && item.assignBranch._id === selectedBranch._id) ||
        // Handle array of branches assignment
        (Array.isArray(item.assignBranch) && item.assignBranch.some(branch => {
          if (typeof branch === 'string') return branch === selectedBranch._id;
          if (typeof branch === 'object' && branch) return branch._id === selectedBranch._id;
          return false;
        })) ||
        // Handle legacy branch field
        (item.branch && item.branch._id === selectedBranch._id) ||
        // Handle legacy branches array
        (Array.isArray(item.branches) && item.branches.some(branch => {
          if (typeof branch === 'string') return branch === selectedBranch._id;
          if (typeof branch === 'object' && branch) return branch._id === selectedBranch._id;
          return false;
        }));
      
      // Section filter - show all items if no section selected, otherwise filter by section
      const matchesSection = !selectedSectionFilter || selectedSectionFilter === '' || 
        (item.assignSection && item.assignSection._id === selectedSectionFilter) ||
        (item.section && item.section._id === selectedSectionFilter) ||
        (item.sectionId && item.sectionId === selectedSectionFilter);
      
      // Search filter
      const matchesSearch = !searchTerm || 
        (item.nameEn || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode || item.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesBranch && matchesSection && matchesSearch;
    });
    

    
    return filtered;
  }, [allItems, selectedBranch, searchTerm, selectedSectionFilter]);

  // Filter branches based on search
  const filteredBranches = useMemo(() => {
    if (!branchSearchTerm) {
      return allBranches;
    }
    return allBranches.filter(branch => 
      branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase())
    );
  }, [allBranches, branchSearchTerm]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowOrderModal(true);
  };





  const doSubmit = async (finalStatus) => {
    try {
      // Additional validation
      if (!selectedBranch?.name) {
        throw new Error('Missing required branch information');
      }
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        orderNo,
        dateTime: dateTime.toISOString(),
        scheduleDate: scheduleDate || null,
        deliveryDate: deliveryDate, // Add delivery date
        status: finalStatus,
        orderType: orderType, // Add order type
        branch: selectedBranch?.name, // Add branch name
        section: selectedSection?.name || 'General', // Use 'General' as default if no section selected
        userName: user?.name || 'Unknown User', // Send user name as string
        items: Object.values(selectedItems).filter(selectedItem => selectedItem && selectedItem.item).map(selectedItem => ({
          itemCode: selectedItem?.item?.itemCode || selectedItem?.item?.code || '',
          itemName: selectedItem?.item?.nameEn || selectedItem?.item?.name || '',
          unit: selectedItem?.item?.unit?.name || selectedItem?.item?.baseUnit?.name || '',
          category: selectedItem?.item?.category?.nameEn || selectedItem?.item?.category?.name || '',
          subCategory: selectedItem?.subCategory || selectedItem?.item?.subCategory?.nameEn || selectedItem?.item?.subCategory?.name || '',
          orderQty: Number(selectedItem.qty)
        }))
      };

      console.log('Submitting order with payload:', payload);

      const response = await axios.post(`${backend_url}/orders`, payload, { headers });
      
      if (response.data) {
        setSubmitSuccess(`Order ${finalStatus === 'Draft' ? 'saved as draft' : 'submitted for approval'} successfully!`);
        setTimeout(() => {
          closeModal();
          setSubmitSuccess('');
        }, 2000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.response?.data?.error || error.response?.data?.message || 'Failed to submit order');
    }
  };

  const onSaveDraft = () => {
    setPendingAction('draft');
    setShowConfirm(true);
  };

  const onSubmitForApproval = () => {
    setPendingAction('approval');
    setShowConfirm(true);
  };

  const confirmAction = () => {
    // Validate required data before submitting
    
    if (!selectedBranch) {
      setSubmitError('Please ensure branch is selected.');
      setShowConfirm(false);
      setPendingAction('');
      return;
    }
    
    if (Object.keys(selectedItems).length === 0) {
      setSubmitError('Please select at least one item.');
      setShowConfirm(false);
      setPendingAction('');
      return;
    }
    
    // Check if any items have quantity > 0
    const validItems = Object.values(selectedItems).filter(item => item && item.qty > 0);
    if (validItems.length === 0) {
      setSubmitError('Please ensure at least one item has quantity greater than 0.');
      setShowConfirm(false);
      setPendingAction('');
      return;
    }
    
    // Validate schedule date when order type is Schedule
    if (orderType === 'Schedule' && !scheduleDate) {
      setSubmitError('Please select a schedule date for scheduled orders.');
      setShowConfirm(false);
      setPendingAction('');
      return;
    }
    
    const finalStatus = pendingAction === 'draft' ? 'Draft' : 'Under Review';
    doSubmit(finalStatus);
    setShowConfirm(false);
    setPendingAction('');
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSelectedItems({});
    setSubmitError('');
    setSubmitSuccess('');
    setSearchTerm('');
    setSelectedSection(null);
  };



  const handleSelectAll = () => {
    if (Object.keys(selectedItems).length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems({});
    } else {
      const allSelected = {};
      filteredItems.filter(item => item && item._id).forEach(item => {
        allSelected[item._id] = { 
          qty: 1, 
          item,
          subCategory: '' // Initialize empty subcategory
        };
      });
      setSelectedItems(allSelected);
    }
  };

  const handleItemToggle = (item) => {
    if (!item || !item._id) {
      return;
    }
    
    if (selectedItems[item._id]) {
      setSelectedItems(prev => {
        const newSelected = { ...prev };
        delete newSelected[item._id];
        return newSelected;
      });
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [item._id]: { 
          qty: 1, 
          item: { ...item }, // Create a copy to ensure it's preserved
          subCategory: '' // Initialize empty subcategory
        }
      }));
    }
  };

  const handleQuantityChange = (itemId, newQty) => {
    if (newQty > 0) {
      setSelectedItems(prev => {
        const currentItem = prev[itemId];
        
        // If item is not selected, find it in allItems and create the selection
        if (!currentItem || !currentItem.item) {
          const item = allItems.find(item => item && item._id === itemId);
          if (!item) {
            console.error('Item not found for ID:', itemId);
            return prev;
          }
          
          return {
            ...prev,
            [itemId]: { 
              qty: newQty,
              item: { ...item },
              subCategory: currentItem?.subCategory || '' // Preserve existing subcategory if any
            }
          };
        }
        
        // Update existing selection
        return {
          ...prev,
          [itemId]: { 
            ...currentItem, 
            qty: newQty 
          }
        };
      });
    } else {
      setSelectedItems(prev => {
        const newSelected = { ...prev };
        delete newSelected[itemId];
        return newSelected;
      });
    }
  };

  const handleQuantityIncrement = (itemId) => {
    const currentQty = selectedItems[itemId]?.qty || 0;
    handleQuantityChange(itemId, currentQty + 1);
  };

  const handleQuantityDecrement = (itemId) => {
    const currentQty = selectedItems[itemId]?.qty || 0;
    if (currentQty > 1) {
      handleQuantityChange(itemId, currentQty - 1);
    } else {
      handleQuantityChange(itemId, 0);
    }
  };

  // Function to recover missing item data
  const recoverMissingItemData = (itemId) => {
    const item = allItems.find(item => item && item._id === itemId);
    return item || null;
  };

  // Function to get subcategory name by ID
  const getSubCategoryName = (subCategoryId) => {
    if (!subCategoryId) return '-';
    
    // First try to find in the modal's subcategories (most recent)
    const modalSubCategory = subCategoriesForModal.find(sub => sub._id === subCategoryId);
    if (modalSubCategory) {
      return modalSubCategory.nameEn || modalSubCategory.name;
    }
    
    // Try to find in global subcategories
    const globalSubCategory = allSubCategories.find(sub => sub._id === subCategoryId);
    if (globalSubCategory) {
      return globalSubCategory.nameEn || globalSubCategory.name;
    }
    
    // If not found, return the ID as fallback
    return subCategoryId;
  };





  const selectedItemsCount = Object.keys(selectedItems).length;
  const estimatedTotal = Object.values(selectedItems).reduce((sum, selectedItem) => {
    return sum + (selectedItem.qty || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading order creation...</p>
        </div>
      </div>
    );
  }

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center">
                <svg className="w-10 h-10 mr-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Order
              </h1>
              <p className="text-blue-100 text-lg">Select branch and create your order efficiently</p>
            </div>
          </div>

        {/* Step-by-step selection interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Branch Selection Box */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Select Branch
              </h2>
            </div>
                          <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={branchSearchTerm}
                    onChange={(e) => setBranchSearchTerm(e.target.value)}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 font-medium shadow-sm"
                  />
                  <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Branch List */}
                <div className="max-h-80 overflow-y-auto border-2 border-blue-200 rounded-xl bg-white shadow-sm">
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map(branch => (
                      <button
                        key={branch._id}
                        onClick={() => handleBranchSelect(branch)}
                        className={`w-full text-left p-4 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
                          selectedBranch?._id === branch._id ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-gray-900">{branch.name}</span>
                          </div>
                          {selectedBranch?._id === branch._id && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      {branchSearchTerm ? 'No branches found matching your search.' : 'No branches available.'}
                    </div>
                  )}
                </div>

                {/* Selected Branch Display */}
                {selectedBranch && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-green-800">Selected: {selectedBranch.name}</span>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>



        {/* Order Creation Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden relative">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-gray-200 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Order
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {selectedBranch?.name} {selectedSection ? `- ${selectedSection?.name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-blue-200 text-2xl font-bold transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Main Content - Two Panel Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Filters and Categories */}
                <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                  <div className="space-y-6">
                    {/* Order Details */}
                    <div className="modern-card p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Order Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order No:</span>
                          <span className="font-medium">{orderNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Branch:</span>
                          <span className="font-medium">{selectedBranch?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">{orderStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <select 
                            className="border rounded px-2 py-1 text-sm" 
                            value={orderType} 
                            onChange={e => setOrderType(e.target.value)}
                          >
                            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {orderType === 'Schedule' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Schedule Date:</span>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{new Date(dateTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Date:</span>
                          <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Items
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by item name or code..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Section Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Section
                      </label>
                      <select
                        value={selectedSectionFilter}
                        onChange={(e) => setSelectedSectionFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Sections</option>
                        {allSections.map(section => (
                          <option key={section._id} value={section._id}>
                            {section.nameEn || section.name || 'Unknown Section'}
                          </option>
                        ))}
                      </select>
                    </div>


                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={handleSelectAll}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        {Object.keys(selectedItems).length === filteredItems.length && filteredItems.length > 0 
                          ? 'Deselect All' 
                          : 'Select All Items'}
                      </button>
                      <button
                        onClick={() => {
                          const allSelected = {};
                          filteredItems.forEach(item => {
                            allSelected[item._id] = { 
                              qty: 1, 
                              item,
                              subCategory: '' // Initialize empty subcategory
                            };
                          });
                          setSelectedItems(allSelected);
                        }}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Fill All to Par
                      </button>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600"># of Items:</span>
                          <span className="font-medium">{selectedItemsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quantity:</span>
                          <span className="font-medium">{estimatedTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Items Table */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Items Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Available Items ({filteredItems.length})
                      </h3>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="flex-1 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input 
                              type="checkbox" 
                              onChange={handleSelectAll}
                              checked={Object.keys(selectedItems).length === filteredItems.length && filteredItems.length > 0}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
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
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.filter(item => item && item._id).map((item) => (
                          <tr key={item._id} className={`hover:bg-gray-50 ${selectedItems[item._id] ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input 
                                type="checkbox" 
                                checked={!!selectedItems[item._id]}
                                onChange={() => handleItemToggle(item)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item?.itemCode || item?.code || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item?.nameEn || item?.name || 'Unknown Item'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item?.category?.nameEn || item?.category?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                               <button
                                 onClick={async () => {
                                   setSelectedItemForSubCategory(item);
                                   setShowSubCategoryModal(true);
                                   
                                   // Fetch subcategories for this item's category
                                   const categoryId = item?.category?._id || item?.category;
                                   if (categoryId) {
                                     const subCategories = await fetchSubCategoriesForCategory(categoryId);
                                     setSubCategoriesForModal(subCategories);
                                   } else {
                                     setSubCategoriesForModal([]);
                                   }
                                 }}
                                 className="w-full bg-gray-200 text-gray-800 px-2 py-1 rounded-md text-sm font-medium hover:bg-gray-300"
                               >
                                 {(() => {
                                   const selectedSubCategoryId = selectedItems[item._id]?.subCategory;
                                   if (!selectedSubCategoryId) return 'Select Subcategory';
                                   // Find the subcategory in all subcategories (not just modal's)
                                   const subCategory = allSubCategories.find(sub => sub._id === selectedSubCategoryId);
                                   return subCategory ? (subCategory.nameEn || subCategory.name) : 'Select Subcategory';
                                 })()}
                               </button>
                             </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item?.unit?.name || item?.baseUnit?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleQuantityDecrement(item._id)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                  disabled={selectedItems[item._id]?.qty <= 1}
                                >
                                  -
                                </button>
                                <input 
                                  type="number" 
                                  min="0.01" 
                                  step="0.01"
                                  className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm" 
                                  value={selectedItems[item._id]?.qty || ''} 
                                  onChange={(e) => {
                                    const newQty = parseFloat(e.target.value) || 0;
                                    handleQuantityChange(item._id, newQty);
                                  }}
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleQuantityIncrement(item._id)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                  disabled={selectedItems[item._id]?.qty >= 999}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-gray-500 text-lg">No items found matching your criteria</div>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {submitError && <div className="text-red-600">{submitError}</div>}
                    {submitSuccess && <div className="text-green-600">{submitSuccess}</div>}
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={closeModal} 
                      className="btn-gradient-secondary px-6 py-2"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={onSaveDraft} 
                      className="btn-gradient-warning px-6 py-2"
                      disabled={selectedItemsCount === 0}
                    >
                      Save as Draft
                    </button>
                    <button 
                      onClick={onSubmitForApproval} 
                      className="btn-gradient-success px-6 py-2"
                      disabled={selectedItemsCount === 0}
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-gray-200 rounded-t-xl">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                  </svg>
                  {pendingAction === 'draft' ? 'Confirm Save as Draft' : `Order #${orderNo}`}
                </h3>
              </div>
              
              <div className="p-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order No:</span>
                        <span className="font-medium">{orderNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{pendingAction === 'draft' ? 'Draft' : 'Under Review'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User:</span>
                        <span className="font-medium">{user?.name || 'Unknown User'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{orderType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="font-medium">{new Date(dateTime).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Date:</span>
                        <span className="font-medium">{deliveryDate ? new Date(deliveryDate).toLocaleDateString() : 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch:</span>
                        <span className="font-medium">{selectedBranch?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Section:</span>
                        <span className="font-medium">{selectedSection?.name || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Count:</span>
                        <span className="font-medium">{selectedItemsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Quantity:</span>
                        <span className="font-medium">{estimatedTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Selected Items</h4>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Category</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.values(selectedItems).filter(selectedItem => {
                          if (!selectedItem || selectedItem.qty <= 0) return false;
                          
                          // If item data is missing, try to recover it
                          if (!selectedItem.item) {
                            const recoveredItem = recoverMissingItemData(selectedItem._id || Object.keys(selectedItems).find(key => selectedItems[key] === selectedItem));
                            if (recoveredItem) {
                              selectedItem.item = recoveredItem;
                              return true;
                            }
                            return false;
                          }
                          
                          return true;
                        }).map((selectedItem, index) => {
                          // Get the subcategory name
                          const subCategoryName = selectedItem?.subCategory ? 
                            getSubCategoryName(selectedItem.subCategory) : 
                            (selectedItem?.item?.subCategory?.nameEn || selectedItem?.item?.subCategory?.name || '-');
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <input 
                                  type="text" 
                                  value={selectedItem?.item?.itemCode || selectedItem?.item?.code || '-'} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-900 text-sm"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                <input 
                                  type="text" 
                                  value={selectedItem?.item?.nameEn || selectedItem?.item?.name || 'Unknown Item'} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-900 text-sm font-medium"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                <input 
                                  type="text" 
                                  value={selectedItem?.item?.category?.nameEn || selectedItem?.item?.category?.name || '-'} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-500 text-sm"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                <input 
                                  type="text" 
                                  value={subCategoryName} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-500 text-sm"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                <input 
                                  type="text" 
                                  value={selectedItem?.item?.unit?.name || selectedItem?.item?.baseUnit?.name || '-'} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-500 text-sm"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                <input 
                                  type="number" 
                                  value={selectedItem.qty} 
                                  readOnly 
                                  className="w-full bg-gray-100 border-none text-gray-900 text-sm font-medium"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowConfirm(false)} 
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmAction} 
                    className={`px-8 py-3 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                      pendingAction === 'draft' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {pendingAction === 'draft' ? 'Yes' : 'Send to Central Kitchen (CK)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Selection Modal */}
        {showSubCategoryModal && selectedItemForSubCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Select Subcategory
                </h3>
                <p className="text-blue-100 mt-2">
                  {selectedItemForSubCategory?.nameEn || selectedItemForSubCategory?.name || 'Unknown Item'}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  Category: {selectedItemForSubCategory?.category?.nameEn || selectedItemForSubCategory?.category?.name || 'Unknown'}
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingSubCategories ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading subcategories...</p>
                    </div>
                  ) : subCategoriesForModal.length > 0 ? (
                    subCategoriesForModal.map(subCategory => (
                      <button
                        key={subCategory._id}
                        onClick={() => {
                          if (!selectedItemForSubCategory?._id) return;
                          setSelectedItems(prev => ({
                            ...prev,
                            [selectedItemForSubCategory._id]: { 
                              ...prev[selectedItemForSubCategory._id], 
                              subCategory: subCategory._id 
                            }
                          }));
                          setShowSubCategoryModal(false);
                          setSelectedItemForSubCategory(null);
                        }}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        <div className="font-medium text-gray-900">
                          {subCategory.nameEn || subCategory.name}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No subcategories found for this category</p>
                      <button
                        onClick={() => {
                          console.log('Debug: Show subcategories info');
                          console.log('Item:', selectedItemForSubCategory);
                          console.log('Item category:', selectedItemForSubCategory?.category);
                          console.log('Fetched subcategories:', subCategoriesForModal);
                        }}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Debug: Show All Subcategories
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSubCategoryModal(false);
                      setSelectedItemForSubCategory(null);
                      setSubCategoriesForModal([]);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </MasterAdminOnly>
  );
};

export default CreateOrder; 