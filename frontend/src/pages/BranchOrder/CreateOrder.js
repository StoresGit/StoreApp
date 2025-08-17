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
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Order form state (for modal)
  const [orderType, setOrderType] = useState('Urgent');
  const [orderStatus, setOrderStatus] = useState('Draft');
  const [orderNo, setOrderNo] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [scheduleDate, setScheduleDate] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});

  // Data state
  const [sections, setSections] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');

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
        
        const [sectionsRes, itemsRes, branchesRes, categoriesRes] = await Promise.all([
          axios.get(`${backend_url}/sections/active`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/items`, { headers }).catch((error) => {
            console.error('Error fetching items:', error);
            return { data: [] };
          }),
          axios.get(`${backend_url}/branch`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/item-categories`, { headers }).catch(() => ({ data: [] })),
        ]);
        
        console.log('API Responses:', {
          sections: sectionsRes.data,
          items: itemsRes.data,
          branches: branchesRes.data,
          categories: categoriesRes.data
        });
        
        setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data.filter(item => item && item._id && typeof item === 'object') : []);
        setAllBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data.filter(cat => cat && cat._id) : []);
        
        // Fetch all subcategories
        await fetchAllSubCategories();
        
        // Debug logging
        console.log('Loaded categories:', categoriesRes.data);
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



  // Filter items based on search and branch
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
      
      // Search filter
      const matchesSearch = !searchTerm || 
        (item.nameEn || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode || item.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesBranch && matchesSearch;
    });
    
    console.log('Item filtering:', {
      selectedBranch: selectedBranch?.name,
      totalItems: allItems.length,
      filteredItems: filtered.length,
      searchTerm,
      branchFilterApplied: !!selectedBranch,
      sampleItems: allItems.slice(0, 3).map(item => ({
        name: item.nameEn || item.name,
        assignBranch: item.assignBranch,
        assignBranchNames: Array.isArray(item.assignBranch) 
          ? item.assignBranch.map(b => b.name).join(', ')
          : item.assignBranch?.name || 'None',
        branch: item.branch?.name || item.branch?._id,
        branches: item.branches
      }))
    });
    
    return filtered;
  }, [allItems, selectedBranch, searchTerm]);




  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowBranchDropdown(false);
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
        scheduleDate: scheduleDate ? scheduleDate.toISOString() : null,
        status: finalStatus,
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
              subCategory: ''
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Create Order</h1>

        {/* Step-by-step selection interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Branch Selection Box */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Select Branch</h2>
            <div className="relative">
              <button
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedBranch ? selectedBranch.name : 'Click to select branch'}
              </button>
              
              {showBranchDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {allBranches.map(branch => (
                    <button
                      key={branch._id}
                      onClick={() => handleBranchSelect(branch)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>



        {/* Order Creation Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Order</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBranch?.name} {selectedSection ? `- ${selectedSection?.name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Main Content - Two Panel Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Filters and Categories */}
                <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Order Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h3>
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{new Date(dateTime).toLocaleDateString()}</span>
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
                                   // Find the subcategory in the modal's subcategories
                                   const subCategory = subCategoriesForModal.find(sub => sub._id === selectedSubCategoryId);
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
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={onSaveDraft} 
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                      disabled={selectedItemsCount === 0}
                    >
                      Save as Draft
                    </button>
                    <button 
                      onClick={onSubmitForApproval} 
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
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
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Confirm Order Details</h3>
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
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{orderType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(dateTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch:</span>
                        <span className="font-medium">{selectedBranch?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Section:</span>
                        <span className="font-medium">{selectedSection?.name}</span>
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
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
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
                        }).map((selectedItem, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {selectedItem?.item?.itemCode || selectedItem?.item?.code || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {selectedItem?.item?.nameEn || selectedItem?.item?.name || 'Unknown Item'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {selectedItem?.item?.category?.nameEn || selectedItem?.item?.category?.name || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {getSubCategoryName(selectedItem?.subCategory)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {selectedItem?.item?.unit?.name || selectedItem?.item?.baseUnit?.name || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {selectedItem.qty}
                            </td>
                          </tr>
                        ))}
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    {pendingAction === 'draft' ? 'Save as Draft' : 'Submit for Approval'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Selection Modal */}
        {showSubCategoryModal && selectedItemForSubCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Subcategory for {selectedItemForSubCategory?.nameEn || selectedItemForSubCategory?.name || 'Unknown Item'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
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
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
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
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MasterAdminOnly>
  );
};

export default CreateOrder; 