import React, { useEffect, useState, useCallback } from 'react';
import ItemDetailsForm from './MainContent/ItemDetailForm';
import axios from 'axios';
import backend_url from '../../config/config';
import { useParams } from 'react-router-dom';

const tabs = ['Item Details', 'Packaging', 'Suppliers', 'Allergens', 'Inventory', 'Recipes'];

export default function ItemTabs({ item: propItem }) {
  const [activeTab, setActiveTab] = useState('Item Details');
  const { id } = useParams();
  const [item, setItem] = useState(propItem || null);
  const [showPackagingForm, setShowPackagingForm] = useState(false);
  const [packagingType, setPackagingType] = useState(''); // 'base' or 'pack'
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [packagingData, setPackagingData] = useState({
    amount: '',
    unit: '',
    packSize: '',
    type: '',
    description: '',
    branches: [],
    brands: [],
    parentPackaging: null
  });
  const [editingPackagingId, setEditingPackagingId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(null);

  // Load existing supplier-item relationships
  const loadSupplierItemRelationships = useCallback(async () => {
    try {
      console.log('Loading suppliers for item:', id);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/supplier-items/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const supplierItems = response.data;
      console.log('Loaded supplier items from backend:', supplierItems);
      
      // Convert supplier items to the format expected by selectedSuppliers state
      const suppliersByPackaging = {};
      
      supplierItems.forEach(supplierItem => {
        let packagingKey;
        
        if (supplierItem.packagingType === 'base') {
          packagingKey = 'base';
        } else if (supplierItem.packagingType === 'pack') {
          packagingKey = 'pack';
        } else if (supplierItem.packagingType === 'additional') {
          // Handle both populated object and ObjectId string
          const packagingId = supplierItem.packaging?._id || supplierItem.packaging;
          packagingKey = `additional_${packagingId}`;
          console.log('Processing additional packaging:', supplierItem.packaging, 'extracted ID:', packagingId);
        } else {
          packagingKey = `${supplierItem.packagingType}-${supplierItem.packaging || ''}`;
        }
        
        console.log(`Mapping supplier ${supplierItem.supplier._id} to packaging key: ${packagingKey}`);
        
        if (!suppliersByPackaging[packagingKey]) {
          suppliersByPackaging[packagingKey] = [];
        }
        suppliersByPackaging[packagingKey].push(supplierItem.supplier._id);
      });
      
      console.log('Final suppliers by packaging:', suppliersByPackaging);
      setSelectedSuppliers(suppliersByPackaging);
    } catch (error) {
      console.error('Error loading supplier-item relationships:', error);
    }
  }, [id]);

  // Save supplier-item relationships
  const saveSupplierItemRelationships = useCallback(async () => {
    try {
      console.log('Saving suppliers for item:', id);
      console.log('Selected suppliers data:', selectedSuppliers);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backend_url}/supplier-items`, {
        itemId: id,
        supplierPackagingData: selectedSuppliers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Supplier-item relationships saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving supplier-item relationships:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }, [id, selectedSuppliers]);

  const handleAddPackaging = useCallback((type) => {
    setPackagingType(type);
    setShowPackagingForm(true);
    setPackagingData({
      amount: '',
      unit: '',
      packSize: '',
      type: type,
      description: '',
      branches: [],
      brands: [],
      parentPackaging: null
    });
  }, []);

  const refreshAllPackagingData = useCallback(async () => {
    try {
      const [packagingRes, additionalPackagingRes] = await Promise.all([
        axios.get(`${backend_url}/packaging/${id}`),
        axios.get(`${backend_url}/packaging`).then(res => {
          console.log('Refreshing all packaging data:', res.data);
          const filtered = res.data.filter(pkg => {
            if (!pkg.itemId) {
              console.warn('Package with no itemId found:', pkg);
              return false;
            }
            return pkg.itemId._id === id;
          });
          console.log('Filtered packaging for current item:', filtered);
          return filtered;
        }).catch(err => {
          console.error('Error fetching all packaging:', err);
          return [];
        })
      ]);
      
      const packagingArr = packagingRes.data;
      const basePackaging = packagingArr.find(p => p.type === 'base');
      const packPackaging = packagingArr.find(p => p.type === 'pack');
      
      setItem(prevItem => ({
        ...prevItem,
        basePackaging,
        packPackaging,
        additionalPackaging: additionalPackagingRes
      }));
      
      console.log('Updated item state:', {
        basePackaging,
        packPackaging,
        additionalPackaging: additionalPackagingRes
      });
    } catch (err) {
      console.error('Error refreshing packaging data:', err);
    }
  }, [id]);

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!packagingData.amount || !packagingData.type) {
      alert('Please fill in quantity and package name');
      return;
    }

    // For non-sub packaging and non-item-base, unit is also required
    if (packagingType !== 'sub' && packagingType !== 'item-base' && !packagingData.unit) {
      alert('Please fill in unit field');
      return;
    }

    try {
      if (packagingType === 'item-base') {
        // Handle updating item's base packaging (unitCount and baseUnit)
        const payload = {
          unitCount: parseFloat(packagingData.amount),
          // We'll keep the existing baseUnit, just update the count
        };

        console.log('Updating item base packaging:', payload);
        await axios.put(`${backend_url}/items/${id}`, payload);
        
        // Update local item state
        setItem(prevItem => ({
          ...prevItem,
          unitCount: parseFloat(packagingData.amount)
        }));
      } else if (packagingType === 'base' || packagingType === 'pack') {
        // Handle existing base/pack packaging (item-specific)
        const payload = {
          itemId: id,
          type: packagingData.type, // Use the editable type from form
          amount: packagingData.amount,
          unit: packagingData.unit,
          ...(packagingType === 'pack' && packagingData.packSize && {
            packSize: packagingData.packSize
          })
        };

        console.log('Submitting base/pack packaging:', payload);
        console.log('Base packaging:', item?.basePackaging);
        console.log('Pack packaging:', item?.packPackaging);
        
        // Use editingPackagingId if available, otherwise check for existing packaging
        if (editingPackagingId) {
          // Update existing packaging using the editingPackagingId
          console.log('Updating packaging with editingPackagingId:', editingPackagingId);
          await axios.put(`${backend_url}/packaging/${editingPackagingId}`, payload);
        } else if (packagingType === 'base' && item?.basePackaging?._id) {
          // Update existing base packaging
          console.log('Updating existing base packaging with ID:', item.basePackaging._id);
          await axios.put(`${backend_url}/packaging/${item.basePackaging._id}`, payload);
        } else if (packagingType === 'pack' && item?.packPackaging?._id) {
          // Update existing pack packaging
          console.log('Updating existing pack packaging with ID:', item.packPackaging._id);
          await axios.put(`${backend_url}/packaging/${item.packPackaging._id}`, payload);
        } else {
          // Create new base/pack packaging only if none exists
          console.log('Creating new base/pack packaging');
          await axios.post(`${backend_url}/packaging/${id}`, payload);
        }
      } else {
        // Handle additional packaging (new system) and sub-packaging
        const payload = {
          itemId: id,
          type: packagingData.type,
          amount: parseFloat(packagingData.amount),
          unit: packagingType === 'sub' ? 
            (packagingData.parentPackaging?.parentUnit || packagingData.unit) : 
            packagingData.unit,
          packSize: parseInt(packagingData.packSize) || null,
          description: packagingData.description,
          branches: packagingData.branches,
          brands: packagingData.brands
        };

        // Add parent packaging information for sub-packaging
        if (packagingData.parentPackaging) {
          payload.parentType = packagingData.parentPackaging.parentType;
          if (packagingData.parentPackaging.parentId) {
            payload.parentPackaging = packagingData.parentPackaging.parentId;
          }
          console.log('Adding parent info to payload:', {
            parentType: payload.parentType,
            parentPackaging: payload.parentPackaging,
            originalParentData: packagingData.parentPackaging
          });
        }

        console.log('Submitting additional packaging:', payload);

        if (editingPackagingId) {
          // Update existing additional packaging
          await axios.put(`${backend_url}/packaging/${editingPackagingId}`, payload);
        } else {
          // Create new additional packaging
          await axios.post(`${backend_url}/packaging`, payload);
        }
      }
      
      // Use the existing refreshAllPackagingData function to properly refresh all data
      await refreshAllPackagingData();
      
      setShowPackagingForm(false);
      setEditingPackagingId(null);
      alert('Packaging saved successfully!');
    } catch (err) {
      console.error('Error saving packaging:', err);
      console.error('Error details:', err.response?.data);
      
      alert(`Error saving packaging: ${err.response?.data?.message || err.message}`);
    }
  }, [packagingData, packagingType, editingPackagingId, id, refreshAllPackagingData]);

  const handleFormCancel = useCallback(() => {
    setShowPackagingForm(false);
    setEditingPackagingId(null);
    setPackagingData({
      amount: '',
      unit: '',
      packSize: '',
      type: '',
      description: '',
      branches: [],
      brands: [],
      parentPackaging: null
    });
  }, []);

  useEffect(() => {
    if (propItem) {
      // Use the item passed from parent and fetch packaging info
      const fetchPackagingInfo = async () => {
        try {
          const [packagingRes, additionalPackagingRes] = await Promise.all([
            axios.get(`${backend_url}/packaging/${id}`),
            axios.get(`${backend_url}/packaging`).then(res => {
              console.log('All packaging data:', res.data);
              const filtered = res.data.filter(pkg => {
                console.log('Checking package:', pkg, 'itemId:', pkg.itemId);
                return pkg.itemId && pkg.itemId._id === id;
              });
              console.log('Filtered packaging for item:', filtered);
              return filtered;
            }).catch(err => {
              console.error('Error fetching all packaging:', err);
              return [];
            })
          ]);
          
        const packagingArr = packagingRes.data;
        const basePackaging = packagingArr.find(p => p.type === 'base');
        const packPackaging = packagingArr.find(p => p.type === 'pack');
        
        console.log('Packaging from API:', packagingArr);
        console.log('Found base packaging:', basePackaging);
        console.log('Found pack packaging:', packPackaging);
          
        setItem({
            ...propItem,
          basePackaging,
            packPackaging,
            additionalPackaging: additionalPackagingRes
        });
      } catch (err) {
          console.error('Error fetching packaging:', err);
          // If packaging fetch fails, still use the propItem
          setItem({
            ...propItem,
            additionalPackaging: []
          });
        }
      };
      fetchPackagingInfo();
    }
  }, [propItem, id]);

  // Fetch branches, brands, suppliers data and existing supplier-item relationships
  useEffect(() => {
    const fetchBranchesAndBrands = async () => {
      try {
        const [branchRes, brandRes, supplierRes] = await Promise.all([
          axios.get(`${backend_url}/branch`),
          axios.get(`${backend_url}/brand`),
          axios.get(`${backend_url}/suppliers`)
        ]);
        setBranches(branchRes.data);
        setBrands(brandRes.data);
        setSuppliers(supplierRes.data);
        
        // Load existing supplier-item relationships if item exists
        if (id) {
          loadSupplierItemRelationships();
        }
      } catch (error) {
        console.error('Error fetching branches, brands, and suppliers:', error);
      }
    };
    fetchBranchesAndBrands();
  }, [id, loadSupplierItemRelationships]);

  // Restore active tab from localStorage when id is available
  useEffect(() => {
    if (id) {
      const savedTab = localStorage.getItem(`activeTab_${id}`);
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, [id]);

  // Auto-detect unit from item's base unit when opening form
  useEffect(() => {
    if (showPackagingForm && item?.baseUnit && !packagingData.unit) {
      setPackagingData(prev => ({
        ...prev,
        unit: item.baseUnit.symbol || item.baseUnit.Symbol || item.baseUnit.name?.toLowerCase() || 'pcs'
      }));
    }
  }, [showPackagingForm, item?.baseUnit, packagingData.unit]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSupplierDropdown && !event.target.closest('.supplier-dropdown')) {
        setShowSupplierDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSupplierDropdown]);

  // Removed pricing calculation functions since unit price is now handled per supplier

  const handleSupplierSelect = (packagingKey, supplierId, event) => {
    event.stopPropagation(); // Prevent dropdown from closing
    
    console.log('Selecting supplier:', supplierId, 'for packaging:', packagingKey);
    
    setSelectedSuppliers(prev => {
      const currentSuppliers = prev[packagingKey] || [];
      const isAlreadySelected = currentSuppliers.includes(supplierId);
      
      let newState;
      if (isAlreadySelected) {
        // Remove supplier if already selected
        newState = {
          ...prev,
          [packagingKey]: currentSuppliers.filter(id => id !== supplierId)
        };
      } else {
        // Add supplier if not selected
        newState = {
          ...prev,
          [packagingKey]: [...currentSuppliers, supplierId]
        };
      }
      
      console.log('Updated selectedSuppliers state:', newState);
      return newState;
    });
  };

  const getSelectedSuppliers = (packagingKey) => {
    return selectedSuppliers[packagingKey] || [];
  };

  const addSupplierRow = (packagingKey) => {
    setShowSupplierDropdown(showSupplierDropdown === packagingKey ? null : packagingKey);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Save the active tab to localStorage
    localStorage.setItem(`activeTab_${id}`, tab);
  };

  // Early return after all hooks are defined
  if (!item) return <div className="p-4">Loading item...</div>;

  const handleAddSubPackaging = (parentType, parentPackaging = null) => {
    setPackagingType('sub');
    setShowPackagingForm(true);
    
    // Pre-fill data based on parent packaging
    let parentData = {};
    if (parentType === 'base' && item?.basePackaging) {
      parentData = {
        parentType: 'base',
        parentAmount: item.basePackaging.amount,
        parentUnit: item.basePackaging.unit,
        parentName: item.basePackaging.type, // Get the actual packaging name
        parentDescription: `amount - ${item.basePackaging.amount} unit - ${item.basePackaging.unit} name - ${item.basePackaging.type}`
      };
    } else if (parentType === 'base' && item?.unitCount && item?.baseUnit) {
      // Handle base packaging from item creation (unitCount)
      parentData = {
        parentType: 'base',
        parentAmount: item.unitCount,
        parentUnit: item.baseUnit.name || item.baseUnit.Symbol || item.baseUnit.symbol,
        parentName: 'base', // Default name for item-based packaging
        parentDescription: `amount - ${item.unitCount} unit - ${item.baseUnit.name || item.baseUnit.Symbol || item.baseUnit.symbol} name - base`
      };
    } else if (parentType === 'base' && item?.additionalPackaging && !item?.basePackaging && !item?.unitCount) {
      // Handle when "base" is actually from additionalPackaging (like the "Bag" case)
      const mainPkg = item.additionalPackaging.find(p => !p.parentType);
      if (mainPkg) {
        parentData = {
          parentType: 'additional', // Change to 'additional' since it's from additionalPackaging
          parentId: mainPkg._id, // Store the actual parent ID
          parentAmount: mainPkg.amount,
          parentUnit: mainPkg.unit,
          parentName: mainPkg.type,
          parentDescription: `amount - ${mainPkg.amount} unit - ${mainPkg.unit} name - ${mainPkg.type}`
        };
      }
    } else if (parentType === 'pack' && item?.packPackaging) {
      parentData = {
        parentType: 'pack',
        parentAmount: item.packPackaging.amount,
        parentUnit: item.packPackaging.unit,
        parentPackSize: item.packPackaging.packSize,
        parentName: item.packPackaging.type, // Get the actual packaging name
        parentDescription: `amount - ${item.packPackaging.amount} unit - ${item.packPackaging.unit} name - ${item.packPackaging.type}`
      };
    } else if (parentType === 'additional' && parentPackaging) {
      console.log('Creating sub-packaging with additional parent:', parentPackaging);
      parentData = {
        parentType: 'additional',
        parentId: parentPackaging._id,
        parentAmount: parentPackaging.amount,
        parentUnit: parentPackaging.unit,
        parentPackSize: parentPackaging.packSize,
        parentName: parentPackaging.type, // Get the actual packaging name
        parentDescription: `amount - ${parentPackaging.amount} unit - ${parentPackaging.unit} name - ${parentPackaging.type}`
      };
      console.log('Parent data created:', parentData);
    }
    
    setPackagingData({
      amount: '',
      unit: parentData.parentUnit || item?.baseUnit?.symbol || item?.baseUnit?.Symbol || item?.baseUnit?.name?.toLowerCase() || 'pcs',
      packSize: '',
      type: '',
      description: '',
      branches: [],
      brands: [],
      parentPackaging: parentData
    });
  };

  const handleEditItemBasePackaging = () => {
    console.log('Editing item base packaging (unitCount):', item?.unitCount, item?.baseUnit);
    
    setPackagingType('item-base');
    setPackagingData({
      amount: item?.unitCount?.toString() || '',
      unit: item?.baseUnit?.symbol || item?.baseUnit?.Symbol || item?.baseUnit?.name?.toLowerCase() || 'kg',
      packSize: '',
      type: item?.baseUnit?.name || 'base',
      description: '',
      branches: [],
      brands: [],
      parentPackaging: null
    });
    
    setEditingPackagingId(null);
    setShowPackagingForm(true);
  };

  const handleEditBasePackaging = () => {
    console.log('Editing base packaging:', item?.basePackaging);
    console.log('Item data:', item);
    
    setPackagingType('base');
    
    // Handle case where base packaging doesn't exist yet
    if (!item?.basePackaging) {
      setPackagingData({
        amount: '',
        unit: item?.baseUnit?.symbol || item?.baseUnit?.Symbol || item?.baseUnit?.name?.toLowerCase() || 'kg',
        packSize: '',
        type: 'base',
        description: '',
        branches: [],
        brands: [],
        parentPackaging: null
      });
      setEditingPackagingId(null); // No existing packaging to edit
    } else {
      setPackagingData({
        amount: item.basePackaging.amount.toString(),
        unit: item.basePackaging.unit,
        packSize: '',
        type: item.basePackaging.type || 'base', // Use existing type or default to 'base'
        description: item.basePackaging.description || '',
        branches: item.basePackaging.branches?.map(b => b._id || b) || [],
        brands: item.basePackaging.brands?.map(b => b._id || b) || [],
        parentPackaging: null
      });
      setEditingPackagingId(item.basePackaging._id); // Set the ID for editing
    }
    
    setShowPackagingForm(true);
  };

  const handleEditPackPackaging = () => {
    console.log('Editing pack packaging:', item?.packPackaging);
    console.log('Pack packaging ID:', item?.packPackaging?._id);
    
    setPackagingType('pack');
    
    // Handle case where pack packaging doesn't exist yet
    if (!item?.packPackaging) {
      setPackagingData({
        amount: '',
        unit: item?.baseUnit?.symbol || item?.baseUnit?.Symbol || item?.baseUnit?.name?.toLowerCase() || 'kg',
        packSize: '',
        type: 'pack',
        description: '',
        branches: [],
        brands: [],
        parentPackaging: null
      });
      setEditingPackagingId(null); // No existing packaging to edit
    } else {
      setPackagingData({
        amount: item.packPackaging.amount.toString(),
        unit: item.packPackaging.unit,
        packSize: item.packPackaging.packSize?.toString() || '',
        type: item.packPackaging.type || 'pack', // Use existing type or default to 'pack'
        description: item.packPackaging.description || '',
        branches: item.packPackaging.branches?.map(b => b._id || b) || [],
        brands: item.packPackaging.brands?.map(b => b._id || b) || [],
        parentPackaging: null
      });
      setEditingPackagingId(item.packPackaging._id); // Set the ID for editing
    }
    
    setShowPackagingForm(true);
  };

  const handleEditAdditionalPackaging = (packaging) => {
    // Check if this is sub-packaging by looking for parentType field
    // Only sub-packaging should have parentType set
    const isSubPackaging = !!packaging.parentType;
    
    if (isSubPackaging) {
      setPackagingType('sub');
      
      // Reconstruct parent data for sub-packaging
      let parentData = {};
      if (packaging.parentType === 'base' && item?.basePackaging) {
        parentData = {
          parentType: 'base',
          parentAmount: item.basePackaging.amount,
          parentUnit: item.basePackaging.unit,
          parentDescription: `amount - ${item.basePackaging.amount} unit - ${item.basePackaging.unit} name - base`
        };
      } else if (packaging.parentType === 'base' && item?.unitCount && item?.baseUnit) {
        // Handle base packaging from item creation (unitCount)
        parentData = {
          parentType: 'base',
          parentAmount: item.unitCount,
          parentUnit: item.baseUnit.name || item.baseUnit.Symbol || item.baseUnit.symbol,
          parentDescription: `amount - ${item.unitCount} unit - ${item.baseUnit.name || item.baseUnit.Symbol || item.baseUnit.symbol} name - base`
        };
      } else if (packaging.parentType === 'pack' && item?.packPackaging) {
        parentData = {
          parentType: 'pack',
          parentAmount: item.packPackaging.amount,
          parentUnit: item.packPackaging.unit,
          parentPackSize: item.packPackaging.packSize,
          parentDescription: `amount - ${item.packPackaging.amount} unit - ${item.packPackaging.unit} name - pack`
        };
      } else if (packaging.parentType === 'additional' && item?.additionalPackaging) {
        const parentPkg = item.additionalPackaging.find(p => p._id === packaging.parentPackaging);
        if (parentPkg) {
          parentData = {
            parentType: 'additional',
            parentId: parentPkg._id,
            parentAmount: parentPkg.amount,
            parentUnit: parentPkg.unit,
            parentPackSize: parentPkg.packSize,
            parentDescription: `amount - ${parentPkg.amount} unit - ${parentPkg.unit} name - ${parentPkg.type}`
          };
        }
      }
      
      setPackagingData({
        amount: packaging.amount.toString(),
        unit: packaging.unit,
        packSize: packaging.packSize?.toString() || '',
        type: packaging.type,
        description: packaging.description || '',
        branches: packaging.branches?.map(b => b._id || b) || [],
        brands: packaging.brands?.map(b => b._id || b) || [],
        parentPackaging: parentData
      });
    } else {
      // Regular additional packaging - treat as normal packaging type
      setPackagingType(packaging.type || 'additional');
      setPackagingData({
        amount: packaging.amount.toString(),
        unit: packaging.unit,
        packSize: packaging.packSize?.toString() || '',
        type: packaging.type,
        description: packaging.description || '',
        branches: packaging.branches?.map(b => b._id || b) || [],
        brands: packaging.brands?.map(b => b._id || b) || [],
        parentPackaging: null
      });
    }
    
    setEditingPackagingId(packaging._id);
    setShowPackagingForm(true);
  };

  const handleDeleteBasePackaging = async () => {
    if (window.confirm('Are you sure you want to delete the base packaging?')) {
      try {
        console.log('Deleting base packaging for item:', id);
        await axios.delete(`${backend_url}/packaging/${id}/base`);
        
        // Refresh all packaging data
        await refreshAllPackagingData();
        alert('Base packaging deleted successfully!');
      } catch (err) {
        console.error('Error deleting base packaging:', err);
        alert('Error deleting base packaging');
      }
    }
  };

  const handleDeletePackPackaging = async () => {
    if (window.confirm('Are you sure you want to delete the pack packaging?')) {
      try {
        console.log('Deleting pack packaging for item:', id);
        await axios.delete(`${backend_url}/packaging/${id}/pack`);
        
        // Refresh all packaging data
        await refreshAllPackagingData();
        alert('Pack packaging deleted successfully!');
      } catch (err) {
        console.error('Error deleting pack packaging:', err);
        alert('Error deleting pack packaging');
      }
    }
  };

  const handleDeleteAdditionalPackaging = async (packagingId) => {
    if (window.confirm('Are you sure you want to delete this packaging?')) {
      try {
        console.log('Deleting additional packaging:', packagingId);
        await axios.delete(`${backend_url}/packaging/${packagingId}`);
        
        // Refresh all packaging data
        await refreshAllPackagingData();
        alert('Packaging deleted successfully!');
      } catch (err) {
        console.error('Error deleting packaging:', err);
        alert('Error deleting packaging');
      }
    }
  };

  const PackagingForm = React.memo(() => {
    // Simple direct handlers to prevent re-renders
    const handleTypeChange = (e) => {
      setPackagingData(prev => ({...prev, type: e.target.value}));
    };
    
    const handleAmountChange = (e) => {
      setPackagingData(prev => ({...prev, amount: e.target.value}));
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#5B2685] mb-4">
          {editingPackagingId ? 'Edit' : 'Add'} {packagingType === 'sub' ? 'Sub-Packaging' : 'Packaging'}
        </h3>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={item?.nameEn || item?.name || ''}
              disabled
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          {/* Parent Packaging Information for Sub-Packaging */}
          {packagingData.parentPackaging && (
            <div className="border rounded-md p-3" style={{backgroundColor: '#e66868', borderColor: '#d44545'}}>
              <label className="block text-sm font-medium text-white mb-1">
                Base packaging
              </label>
              <p className="text-sm text-white">
                {packagingData.parentPackaging.parentAmount} {packagingData.parentPackaging.parentUnit} {packagingData.parentPackaging.parentName || packagingData.parentPackaging.parentType}
              </p>
            </div>
          )}

          {/* Package Name - Always editable */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Name *
            </label>
            <input
              type="text"
              value={packagingData.type || ''}
              onChange={handleTypeChange}
              placeholder="Enter package name (e.g., bulk container, retail bag, wholesale box)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              required
              autoComplete="off"
              autoFocus={!editingPackagingId} // Auto-focus for new packaging
            />
          </div>

          {/* Show unit field only for non-sub packaging and non-item-base */}
          {packagingType !== 'sub' && packagingType !== 'item-base' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity in this package *
              </label>
              <input
                type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={handleAmountChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  placeholder="Enter quantity (e.g., 1, 2.5, 10)"
                required 
                  autoComplete="off"
                onFocus={(e) => e.target.select()} // Select all text on focus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit * (Auto-detected from item)
              </label>
              <input
                type="text"
                value={packagingData.unit}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  placeholder="Auto-detected from item"
              />
            </div>
          </div>
          ) : packagingType === 'item-base' ? (
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Quantity *
                </label>
                <input
                  type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={handleAmountChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="Enter base quantity (e.g., 1, 2.5, 10)"
                  required
                autoComplete="off"
                onFocus={(e) => e.target.select()} // Select all text on focus
                />
              <p className="text-xs text-gray-500 mt-1">
                Unit: {item?.baseUnit?.name || item?.baseUnit?.Symbol || item?.baseUnit?.symbol || 'N/A'}
              </p>
              </div>
                    ) : packagingType === 'item-base' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={(e) => setPackagingData(prev => ({...prev, amount: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="Enter base quantity (e.g., 1, 2.5, 10)"
                required 
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unit: {item?.baseUnit?.name || item?.baseUnit?.Symbol || item?.baseUnit?.symbol || 'N/A'}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity in this package *
              </label>
              <input
                type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={handleAmountChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="Enter quantity (e.g., 1, 2.5, 10)"
                required 
                autoComplete="off"
                onFocus={(e) => e.target.select()} // Select all text on focus
              />
            </div>
          )}

          {/* Pricing Preview removed - unit prices now handled per supplier */}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleFormCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#5B2685] text-white rounded-md hover:bg-[#4A1F6F] transition-colors"
            >
              {editingPackagingId ? 'Update' : 'Add'} Packaging
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'Item Details':
        return <div className="mt-6">
          <ItemDetailsForm item={item}/>
        </div>
        
      case 'Packaging':
        return (
          <div className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#5B2685]">Packaging</h2>
              <button
                onClick={() => handleAddPackaging('base')}
                className="bg-[#5B2685] text-white px-4 py-2 rounded-md hover:bg-[#4A1F6F] transition-colors"
              >
                Create Base Package
              </button>
            </div>

            {/* Show existing packaging items */}
            <div className="space-y-4">
              {/* Base packaging from unitCount */}
              {item?.unitCount && item?.baseUnit && (
              <div className="border rounded-lg p-4 shadow-sm" style={{backgroundColor: '#e66868', borderColor: '#d44545'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-white font-bold mb-1">Base</h3>
                <p className="text-sm text-white">
                        {item.unitCount} {item.baseUnit.name} of {item.nameEn || item.name}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => handleEditItemBasePackaging()}
                        className="text-sm text-white hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('base')}
                        className="text-sm text-white hover:underline"
                      >
                        Add Sub-Packaging
                      </button>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Default
                    </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom packaging items - only show if no item base packaging */}
              {item?.basePackaging && !item?.unitCount && (
                <div className="border rounded-lg p-4 shadow-sm" style={{backgroundColor: '#e66868', borderColor: '#d44545'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-white font-bold mb-1">Base (Custom)</h3>
                      <p className="text-sm text-white">
                        {item.nameEn || item.name} {item.basePackaging.amount}{item.basePackaging.unit}
                      </p>
                    </div>
                    <div className="flex gap-2">
                <button 
                  onClick={handleEditBasePackaging}
                        className="text-sm text-white hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('base')}
                        className="text-sm text-white hover:underline"
                      >
                        Add Sub-Packaging
                      </button>
                      <button 
                        onClick={() => handleDeleteBasePackaging()}
                        className="text-sm text-white hover:underline"
                      >
                        Delete
                </button>
              </div>
                  </div>
                </div>
              )}

              {item?.packPackaging && (
              <div className="border border-[#3F88C5] rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                <h3 className="text-sm text-[#3F88C5] font-bold mb-1">Pack</h3>
                <p className="text-sm text-gray-800">
                        {item.nameEn || item.name} {item.packPackaging.packSize} x {item.packPackaging.amount}{item.packPackaging.unit}
                </p>
                    </div>
                    <div className="flex gap-2">
                <button 
                  onClick={handleEditPackPackaging}
                        className="text-sm text-[#3F88C5] hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('pack')}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Add Sub-Packaging
                      </button>
                      <button 
                        onClick={() => handleDeletePackPackaging()}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional packaging items from Packaging collection - Hierarchical Display */}
              {item?.additionalPackaging && (() => {
                // Reverse the order to show proper hierarchy: Bulk -> B -> C
                const packages = [...item.additionalPackaging].reverse();
                
                return packages.map((pkg, index) => {
                  // Determine if this is sub-packaging based on position in hierarchy
                  // In the reversed array, anything after index 0 is sub-packaging
                  let isSubPackaging = index > 0;
                  let cumulativeMultiplier = 1;
                  let allParentDescriptions = [];
                  
                  if (isSubPackaging) {
                    // Calculate cumulative multiplier from ALL parent levels
                    for (let i = 0; i < index; i++) {
                      const parentPkg = packages[i];
                      const parentUnits = parentPkg.packSize ? (parentPkg.packSize * parentPkg.amount) : parentPkg.amount;
                      cumulativeMultiplier *= parentUnits;
                      allParentDescriptions.push(`${parentPkg.packSize ? `${parentPkg.packSize} x ` : ''}${parentPkg.amount}`);
                    }
                  }
                  
                  const baseUnits = pkg.packSize ? (pkg.packSize * pkg.amount) : pkg.amount;
                  const totalUnits = baseUnits * cumulativeMultiplier;
                  
                  // Create full multiplication description
                  const fullMultiplicationDesc = isSubPackaging ? 
                    `${allParentDescriptions.join(' x ')} x ${pkg.packSize ? `${pkg.packSize} x ` : ''}${pkg.amount} ${pkg.unit}` :
                    `${pkg.packSize ? `${pkg.packSize} x ` : ''}${pkg.amount} ${pkg.unit}`;
                
                  return (
                  <div key={index} className={`border rounded-lg p-4 shadow-sm ${isSubPackaging ? 'border-blue-300 bg-blue-50 ml-8' : 'ml-0'}`} style={isSubPackaging ? {} : {backgroundColor: '#e66868', borderColor: '#d44545'}}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold mb-1 capitalize ${isSubPackaging ? 'text-blue-700' : 'text-white'}`}>
                          {isSubPackaging && '↳ '}{pkg.type}
                        </h3>
                        <p className={`text-sm ${isSubPackaging ? 'text-gray-800' : 'text-white'}`}>
                          {isSubPackaging ? (
                            (() => {
                              // Build hierarchical calculation based on package order
                              // Since packages are stored in creation order, we can use their position to determine hierarchy
                              const packages = [...item.additionalPackaging].reverse(); // Reverse to get proper hierarchy (oldest first)
                              const currentIndex = packages.findIndex(p => p._id === pkg._id);
                              
                              console.log('=== HIERARCHICAL CALCULATION DEBUG ===');
                              console.log('Package type:', pkg.type);
                              console.log('Current index in hierarchy:', currentIndex);
                              console.log('All packages in order:', packages.map(p => ({type: p.type, amount: p.amount, unit: p.unit})));
                              
                              if (currentIndex > 0) {
                                // This is a sub-packaging, calculate hierarchically
                                const basePkg = packages[0]; // First package is the base
                                let totalAmount = basePkg.amount; // Start with base amount
                                let unitValue = basePkg.amount; // For calculating per-unit value
                                let multipliers = [];
                                
                                // Calculate through the hierarchy up to current package
                                for (let i = 1; i <= currentIndex; i++) {
                                  const levelPkg = packages[i];
                                  multipliers.push(levelPkg.amount);
                                  totalAmount = totalAmount * levelPkg.amount; // Total amount multiplies
                                  unitValue = unitValue / levelPkg.amount; // Unit value divides
                                }
                                
                                console.log('Hierarchical calculation:', {
                                  base: `${basePkg.amount} ${basePkg.unit}`,
                                  multipliers: multipliers,
                                  totalAmount: totalAmount,
                                  unitValue: unitValue,
                                  result: `${pkg.amount} ${pkg.type} × ${totalAmount} ${basePkg.unit} total, ${unitValue.toFixed(3)} ${basePkg.unit} per ${pkg.type}`
                                });
                                
                                // Build display string showing the multiplication for total
                                let displayParts = [`${basePkg.amount} ${basePkg.unit}`];
                                
                                for (let i = 1; i <= currentIndex; i++) {
                                  const levelPkg = packages[i];
                                  displayParts.push(`× ${levelPkg.amount}`);
                                }
                                
                                const finalTotal = totalAmount.toFixed(totalAmount < 1 ? 3 : 2);
                                console.log('=== END DEBUG ===');
                                
                                // Show in the format: "50 kilogram x 4 carton = 200 kilogram"
                                // We need to calculate the cumulative parent value up to this level
                                let cumulativeParentValue = basePkg.amount;
                                for (let i = 1; i < currentIndex; i++) {
                                  cumulativeParentValue = cumulativeParentValue * packages[i].amount;
                                }
                                
                                const result = cumulativeParentValue * pkg.amount;
                                
                                return `${cumulativeParentValue} ${basePkg.unit} × ${pkg.amount} ${pkg.type} = ${result} ${basePkg.unit}`;
                              } else {
                                // This is the base package, show simple format
                                console.log('This is the base package');
                                console.log('=== END DEBUG ===');
                                return `${pkg.amount} ${pkg.unit}`;
                              }
                            })()
                          ) : (
                            `${pkg.packSize ? `${pkg.packSize} x ` : ''}${pkg.amount} ${pkg.unit}`
                          )}
                        </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                      )}
                      
                      {/* Pricing Information removed - handled per supplier */}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleEditAdditionalPackaging(pkg)}
                        className={`text-sm hover:underline ${isSubPackaging ? 'text-blue-600' : 'text-white'}`}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('additional', pkg)}
                        className={`text-sm hover:underline ${isSubPackaging ? 'text-green-600' : 'text-white'}`}
                      >
                        Add Sub-Packaging
                      </button>
                      <button 
                        onClick={() => handleDeleteAdditionalPackaging(pkg._id)}
                        className={`text-sm hover:underline ${isSubPackaging ? 'text-red-600' : 'text-white'}`}
                      >
                        Delete
                </button>
              </div>
                  </div>
                  </div>
                  );
                });
              })()}

              {/* Show message when no packaging */}
              {!item?.unitCount && !item?.basePackaging && !item?.packPackaging && (!item?.additionalPackaging || item.additionalPackaging.length === 0) && (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  No packaging configured. Click "Add More Packaging" to create packaging options.
                </div>
              )}
            </div>
          </div>
        );

      case 'Suppliers':
        return (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-[#5B2685] mb-4">Suppliers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-[#E0E0E0] text-sm">
                <thead className="bg-[#F2F2F2] text-[#5B2685] font-semibold">
                  <tr>
                    <th className="p-2 text-left">Package Item Name</th>
                    <th className="p-2 text-left">Supplier Name</th>
                    <th className="p-2 text-left">Item Name</th>
                    <th className="p-2 text-left">Supplier Item Code</th>
                    <th className="p-2 text-left">Pricing UOM</th>
                    <th className="p-2 text-left">Unit Price (SAR)</th>
                    <th className="p-2 text-left">Total Units</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base packaging rows - one for each selected supplier */}
                  {item?.unitCount && item?.baseUnit && (
                    <>
                      {getSelectedSuppliers('base').length > 0 ? (
                        getSelectedSuppliers('base').map((supplierId, index) => {
                          const supplier = suppliers.find(s => s._id === supplierId);
                          return (
                            <tr key={`base-${supplierId}`} className="border-t border-gray-200">
                              <td className="p-2">
                                {index === 0 ? `${item.unitCount} x ${item.baseUnit.name} of ${item.nameEn || item.name}` : ''}
                              </td>
                              <td className="p-2">
                                {supplier?.legalName || 'Unknown Supplier'}
                              </td>
                              <td className="p-2">{item.nameEn || item.name}</td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="Item Code"
                                  className="w-full p-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="p-2">{item.baseUnit.name}</td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-full p-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="p-2 text-center">{item.unitCount}</td>
                            </tr>
                          );
                        })
                      ) : (
                  <tr className="border-t border-gray-200">
                          <td className="p-2">{item.unitCount} x {item.baseUnit.name} of {item.nameEn || item.name}</td>
                          <td className="p-2 relative supplier-dropdown">
                            <button
                              onClick={() => addSupplierRow('base')}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Add Suppliers
                            </button>
                            {showSupplierDropdown === 'base' && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                  Select multiple suppliers
                                </div>
                                {suppliers.map(supplier => (
                                  <label
                                    key={supplier._id}
                                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                      getSelectedSuppliers('base').includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={getSelectedSuppliers('base').includes(supplier._id)}
                                        onChange={(e) => handleSupplierSelect('base', supplier._id, e)}
                                        className="cursor-pointer"
                                      />
                                      {supplier.legalName}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-gray-400" colSpan="5">Select suppliers to add pricing details</td>
                        </tr>
                      )}
                      
                      {/* Add more suppliers button for base packaging */}
                      {getSelectedSuppliers('base').length > 0 && (
                        <tr className="border-t border-gray-100">
                          <td className="p-2"></td>
                          <td className="p-2 relative supplier-dropdown">
                            <button
                              onClick={() => addSupplierRow('base')}
                              className="text-green-600 hover:text-green-800 underline text-sm"
                            >
                              + Add More Suppliers
                            </button>
                            {showSupplierDropdown === 'base' && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                  Select multiple suppliers
                                </div>
                                {suppliers.map(supplier => (
                                  <label
                                    key={supplier._id}
                                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                      getSelectedSuppliers('base').includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={getSelectedSuppliers('base').includes(supplier._id)}
                                        onChange={(e) => handleSupplierSelect('base', supplier._id, e)}
                                        className="cursor-pointer"
                                      />
                                      {supplier.legalName}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2" colSpan="5"></td>
                        </tr>
                      )}
                    </>
                  )}
                  
                  {/* Pack packaging rows - one for each selected supplier */}
                  {item?.packPackaging && (
                    <>
                      {getSelectedSuppliers('pack').length > 0 ? (
                        getSelectedSuppliers('pack').map((supplierId, index) => {
                          const supplier = suppliers.find(s => s._id === supplierId);
                          return (
                            <tr key={`pack-${supplierId}`} className="border-t border-gray-200">
                              <td className="p-2">
                                {index === 0 ? `${item.nameEn || item.name} ${item.packPackaging.packSize} x ${item.packPackaging.amount}${item.packPackaging.unit}` : ''}
                              </td>
                              <td className="p-2">
                                {supplier?.legalName || 'Unknown Supplier'}
                              </td>
                              <td className="p-2">{item.nameEn || item.name}</td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="Item Code"
                                  className="w-full p-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="p-2">{item.packPackaging.packSize} x {item.packPackaging.unit}</td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-full p-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="p-2 text-center">{item.packPackaging.packSize * item.packPackaging.amount}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="border-t border-gray-200">
                          <td className="p-2">{item.nameEn || item.name} {item.packPackaging.packSize} x {item.packPackaging.amount}{item.packPackaging.unit}</td>
                          <td className="p-2 relative supplier-dropdown">
                            <button
                              onClick={() => addSupplierRow('pack')}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Add Suppliers
                            </button>
                            {showSupplierDropdown === 'pack' && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                  Select multiple suppliers
                                </div>
                                {suppliers.map(supplier => (
                                  <label
                                    key={supplier._id}
                                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                      getSelectedSuppliers('pack').includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={getSelectedSuppliers('pack').includes(supplier._id)}
                                        onChange={(e) => handleSupplierSelect('pack', supplier._id, e)}
                                        className="cursor-pointer"
                                      />
                                      {supplier.legalName}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-gray-400" colSpan="5">Select suppliers to add pricing details</td>
                        </tr>
                      )}
                      
                      {/* Add more suppliers button for pack packaging */}
                      {getSelectedSuppliers('pack').length > 0 && (
                        <tr className="border-t border-gray-100">
                          <td className="p-2"></td>
                          <td className="p-2 relative supplier-dropdown">
                            <button
                              onClick={() => addSupplierRow('pack')}
                              className="text-green-600 hover:text-green-800 underline text-sm"
                            >
                              + Add More Suppliers
                            </button>
                            {showSupplierDropdown === 'pack' && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                  Select multiple suppliers
                                </div>
                                {suppliers.map(supplier => (
                                  <label
                                    key={supplier._id}
                                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                      getSelectedSuppliers('pack').includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={getSelectedSuppliers('pack').includes(supplier._id)}
                                        onChange={(e) => handleSupplierSelect('pack', supplier._id, e)}
                                        className="cursor-pointer"
                                      />
                                      {supplier.legalName}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2" colSpan="5"></td>
                        </tr>
                      )}
                    </>
                  )}

                                {/* Additional packaging rows with hierarchical display */}
              {item?.additionalPackaging && item.additionalPackaging.map((pkg, index) => {
                const isSubPackaging = pkg.parentPackaging || pkg.parentType;
                
                // Calculate total units considering parent packaging multiplication
                let totalUnits = pkg.packSize ? (pkg.packSize * pkg.amount) : pkg.amount;
                let parentMultiplier = 1;
                let parentDescription = '';
                
                if (isSubPackaging) {
                  // Find parent packaging and calculate multiplier
                  if (pkg.parentType === 'base' && item?.basePackaging) {
                    // For base packaging, multiply packSize × amount
                    parentMultiplier = item.basePackaging.packSize ? (item.basePackaging.packSize * item.basePackaging.amount) : item.basePackaging.amount;
                    parentDescription = `${item.basePackaging.packSize ? `${item.basePackaging.packSize} x ` : ''}${item.basePackaging.amount} ${item.basePackaging.unit}`;
                  } else if (pkg.parentType === 'pack' && item?.packPackaging) {
                    parentMultiplier = item.packPackaging.packSize * item.packPackaging.amount;
                    parentDescription = `${item.packPackaging.packSize} x ${item.packPackaging.amount} ${item.packPackaging.unit}`;
                  } else if (pkg.parentType === 'additional' && item?.additionalPackaging) {
                    const parentPkg = item.additionalPackaging.find(p => p._id === pkg.parentPackaging);
                    if (parentPkg) {
                      parentMultiplier = parentPkg.packSize ? (parentPkg.packSize * parentPkg.amount) : parentPkg.amount;
                      parentDescription = `${parentPkg.packSize ? `${parentPkg.packSize} x ` : ''}${parentPkg.amount} ${parentPkg.unit}`;
                    }
                  }
                  totalUnits = totalUnits * parentMultiplier;
                }
                
                const packagingKey = `additional_${pkg._id}`;
                console.log('Generated packaging key:', packagingKey, 'for package:', pkg);
                
                return (
                  <React.Fragment key={index}>
                    {getSelectedSuppliers(packagingKey).length > 0 ? (
                      getSelectedSuppliers(packagingKey).map((supplierId, supplierIndex) => {
                        const supplier = suppliers.find(s => s._id === supplierId);
                        return (
                          <tr key={`${packagingKey}-${supplierId}`} className={`border-t border-gray-200 ${isSubPackaging ? 'bg-blue-50' : ''}`}>
                    <td className="p-2">
                              {supplierIndex === 0 ? (
                                <div>
                                  {isSubPackaging && <span className="text-blue-600 text-xs">↳ Sub: </span>}
                                  {`${pkg.packSize ? `${pkg.packSize} x ` : ''}${pkg.amount} ${pkg.unit} of ${item.nameEn || item.name}`}
                                  {isSubPackaging && (
                                    <div className="text-xs text-blue-500 mt-1">
                                      × {parentMultiplier} ({parentDescription}) = {totalUnits} total units
                                    </div>
                                  )}
                                </div>
                              ) : ''}
                            </td>
                            <td className="p-2">
                              {supplier?.legalName || 'Unknown Supplier'}
                            </td>
                            <td className="p-2">{item.nameEn || item.name}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Item Code"
                                className="w-full p-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="p-2">{pkg.unit}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full p-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <span className="font-medium">{totalUnits}</span>
                              <div className="text-xs text-gray-500">
                                Total Available
                              </div>
                    </td>
                  </tr>
                        );
                      })
                    ) : (
                      <tr className={`border-t border-gray-200 ${isSubPackaging ? 'bg-blue-50' : ''}`}>
                        <td className="p-2">
                          <div>
                            {isSubPackaging ? (
                              <span>
                                {parentDescription} × {pkg.packSize ? `${pkg.packSize} x ` : ''}{pkg.amount} {pkg.unit} of {item.nameEn || item.name} = {totalUnits} total units
                              </span>
                            ) : (
                              <span>
                                {pkg.packSize ? `${pkg.packSize} x ` : ''}{pkg.amount} {pkg.unit} of {item.nameEn || item.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 relative supplier-dropdown">
                          <button
                            onClick={() => addSupplierRow(packagingKey)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Add Suppliers
                          </button>
                          {showSupplierDropdown === packagingKey && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                              <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                Select multiple suppliers
                              </div>
                              {suppliers.map(supplier => (
                                <label
                                  key={supplier._id}
                                  className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                    getSelectedSuppliers(packagingKey).includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={getSelectedSuppliers(packagingKey).includes(supplier._id)}
                                      onChange={(e) => handleSupplierSelect(packagingKey, supplier._id, e)}
                                      className="cursor-pointer"
                                    />
                                    {supplier.legalName}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-gray-400" colSpan="5">Select suppliers</td>
                      </tr>
                    )}
                    
                    {/* Add more suppliers button for additional packaging */}
                    {getSelectedSuppliers(packagingKey).length > 0 && (
                      <tr className="border-t border-gray-100">
                        <td className="p-2"></td>
                        <td className="p-2 relative supplier-dropdown">
                          <button
                            onClick={() => addSupplierRow(packagingKey)}
                            className="text-green-600 hover:text-green-800 underline text-sm"
                          >
                            + Add More Suppliers
                          </button>
                          {showSupplierDropdown === packagingKey && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-48 max-h-60 overflow-y-auto">
                              <div className="p-2 border-b bg-gray-50 text-xs font-medium">
                                Select multiple suppliers
                              </div>
                              {suppliers.map(supplier => (
                                <label
                                  key={supplier._id}
                                  className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer ${
                                    getSelectedSuppliers(packagingKey).includes(supplier._id) ? 'bg-blue-50 text-blue-700' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={getSelectedSuppliers(packagingKey).includes(supplier._id)}
                                      onChange={(e) => handleSupplierSelect(packagingKey, supplier._id, e)}
                                      className="cursor-pointer"
                                    />
                                    {supplier.legalName}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2" colSpan="5"></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

                  {/* Show message when no packaging available */}
                  {!item?.unitCount && !item?.packPackaging && (!item?.additionalPackaging || item.additionalPackaging.length === 0) && (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        No packaging configured. Please add packaging in the Packaging tab to add supplier pricing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Save Suppliers Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={async () => {
                  try {
                    await saveSupplierItemRelationships();
                    alert('Suppliers saved successfully!');
                  } catch (error) {
                    alert('Error saving suppliers. Please try again.');
                  }
                }}
                className="px-4 py-2 bg-[#5B2685] text-white rounded hover:bg-[#4A1D6B] transition-colors"
              >
                Save Suppliers
              </button>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-600 mt-6">Coming Soon...</div>;
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-300 flex gap-6">
        {tabs.map((tab) => (
          <div
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`cursor-pointer pb-2 text-sm font-medium ${
              activeTab === tab
                ? 'text-[#5B2685] border-b-2 border-[#5B2685]'
                : 'text-gray-500'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div>{renderContent()}</div>

      {/* Packaging Form Modal */}
      {showPackagingForm && <PackagingForm />}
    </div>
  );
}