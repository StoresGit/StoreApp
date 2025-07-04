import React, { useEffect, useState, useCallback } from 'react';
import ItemDetailsForm from './MainContent/ItemDetailForm';
import axios from 'axios';
import backend_url from '../../config/config';
import { useParams } from 'react-router-dom';

const tabs = ['Item Details', 'Packaging', 'Suppliers', 'Allergens', 'Inventory', 'Recipes'];

export default function ItemTabs({ item: propItem }) {
  const [activeTab, setActiveTab] = useState('Packaging');
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/supplier-items/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const supplierItems = response.data;
      
      // Convert supplier items to the format expected by selectedSuppliers state
      const suppliersByPackaging = {};
      
      supplierItems.forEach(supplierItem => {
        let packagingKey;
        
        if (supplierItem.packagingType === 'base') {
          packagingKey = 'base';
        } else if (supplierItem.packagingType === 'pack') {
          packagingKey = 'pack';
        } else if (supplierItem.packagingType === 'additional') {
          packagingKey = `additional_${supplierItem.packaging || 0}`;
        } else {
          packagingKey = `${supplierItem.packagingType}-${supplierItem.packaging || ''}`;
        }
        
        if (!suppliersByPackaging[packagingKey]) {
          suppliersByPackaging[packagingKey] = [];
        }
        suppliersByPackaging[packagingKey].push(supplierItem.supplier._id);
      });
      
      setSelectedSuppliers(suppliersByPackaging);
    } catch (error) {
      console.error('Error loading supplier-item relationships:', error);
    }
  }, [id]);

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

  // Pricing calculation functions
  const calculatePackagingPrice = (packaging) => {
    if (!item?.unitPrice || !packaging?.amount) return 0;
    
    let totalUnits = packaging.amount;
    
    // If it's a pack type, multiply by pack size
    if (packaging.packSize && packaging.packSize > 0) {
      totalUnits = packaging.amount * packaging.packSize;
    }
    
    return (item.unitPrice * totalUnits).toFixed(2);
  };

  const calculateVATAmount = (packaging) => {
    const totalPrice = parseFloat(calculatePackagingPrice(packaging));
    if (!totalPrice || !item?.tax?.rate) return 0;
    
    const vatRate = item.tax.rate;
    
    if (item.priceIncludesVAT) {
      // Price includes VAT, calculate VAT amount
      return (totalPrice * vatRate / (100 + vatRate)).toFixed(2);
    } else {
      // Price excludes VAT, calculate VAT amount to add
      return (totalPrice * vatRate / 100).toFixed(2);
    }
  };

  const calculatePriceExcludingVAT = (packaging) => {
    const totalPrice = parseFloat(calculatePackagingPrice(packaging));
    if (!totalPrice || !item?.tax?.rate) return totalPrice.toFixed(2);
    
    const vatRate = item.tax.rate;
    
    if (item.priceIncludesVAT) {
      // Remove VAT from price
      return (totalPrice / (1 + vatRate / 100)).toFixed(2);
    } else {
      // Price already excludes VAT
      return totalPrice.toFixed(2);
    }
  };

  const handleSupplierSelect = (packagingKey, supplierId, event) => {
    event.stopPropagation(); // Prevent dropdown from closing
    
    setSelectedSuppliers(prev => {
      const currentSuppliers = prev[packagingKey] || [];
      const isAlreadySelected = currentSuppliers.includes(supplierId);
      
      if (isAlreadySelected) {
        // Remove supplier if already selected
        return {
          ...prev,
          [packagingKey]: currentSuppliers.filter(id => id !== supplierId)
        };
      } else {
        // Add supplier if not selected
        return {
          ...prev,
          [packagingKey]: [...currentSuppliers, supplierId]
        };
      }
    });
  };

  const getSelectedSuppliers = (packagingKey) => {
    return selectedSuppliers[packagingKey] || [];
  };



  const addSupplierRow = (packagingKey) => {
    setShowSupplierDropdown(showSupplierDropdown === packagingKey ? null : packagingKey);
  };

  // Save supplier-item relationships
  const saveSupplierItemRelationships = async () => {
    try {
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
      throw error;
    }
  };

  const calculateUnitPriceIncludingTax = () => {
    if (!item?.unitPrice || !item?.tax?.rate) return item?.unitPrice || 0;
    
    const unitPrice = parseFloat(item.unitPrice);
    const vatRate = item.tax.rate;
    
    if (item.priceIncludesVAT) {
      return unitPrice.toFixed(2);
    } else {
      return (unitPrice * (1 + vatRate / 100)).toFixed(2);
    }
  };

  if (!item) return <div className="p-4">Loading item...</div>;

  const handleAddPackaging = (type) => {
    let packagingTypeValue = '';
    if (type === 'new') {
      // Open modal for new packaging type
      setPackagingType('bulk'); // Default to bulk for new packaging
      packagingTypeValue = 'bulk';
    } else {
    setPackagingType(type);
      packagingTypeValue = type;
    }
    setShowPackagingForm(true);
    setPackagingData({
      amount: '',
      unit: '',
      packSize: '',
      type: packagingTypeValue,
      description: '',
      branches: [],
      brands: [],
      parentPackaging: null
    });
  };

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
        parentDescription: `${item.nameEn || item.name} ${item.basePackaging.amount}${item.basePackaging.unit}`
      };
    } else if (parentType === 'pack' && item?.packPackaging) {
      parentData = {
        parentType: 'pack',
        parentAmount: item.packPackaging.amount,
        parentUnit: item.packPackaging.unit,
        parentPackSize: item.packPackaging.packSize,
        parentDescription: `${item.nameEn || item.name} ${item.packPackaging.packSize} x ${item.packPackaging.amount}${item.packPackaging.unit}`
      };
    } else if (parentType === 'additional' && parentPackaging) {
      parentData = {
        parentType: 'additional',
        parentId: parentPackaging._id,
        parentAmount: parentPackaging.amount,
        parentUnit: parentPackaging.unit,
        parentPackSize: parentPackaging.packSize,
        parentDescription: `${parentPackaging.packSize ? `${parentPackaging.packSize} x ` : ''}${parentPackaging.amount} ${parentPackaging.unit}`
      };
    }
    
    setPackagingData({
      amount: '',
      unit: item?.baseUnit?.symbol || item?.baseUnit?.Symbol || item?.baseUnit?.name?.toLowerCase() || 'pcs',
      packSize: '',
      type: '',
      description: '',
      branches: [],
      brands: [],
      parentPackaging: parentData
    });
  };

  const handleEditAdditionalPackaging = (packaging) => {
    setPackagingType(packaging.type);
    setPackagingData({
      amount: packaging.amount.toString(),
      unit: packaging.unit,
      packSize: packaging.packSize?.toString() || '',
      type: packaging.type,
      description: packaging.description || '',
      branches: packaging.branches?.map(b => b._id || b) || [],
      brands: packaging.brands?.map(b => b._id || b) || []
    });
    setEditingPackagingId(packaging._id);
    setShowPackagingForm(true);
  };

  const refreshAllPackagingData = async () => {
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
      
      setItem({
        ...item,
        basePackaging,
        packPackaging,
        additionalPackaging: additionalPackagingRes
      });
      
      console.log('Updated item state:', {
        basePackaging,
        packPackaging,
        additionalPackaging: additionalPackagingRes
      });
    } catch (err) {
      console.error('Error refreshing packaging data:', err);
    }
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!packagingData.amount || !packagingData.unit || !packagingData.packSize) {
      alert('Please fill in amount, unit, and pack size');
      return;
    }

    try {
      if (packagingType === 'base' || packagingType === 'pack') {
        // Handle existing base/pack packaging (item-specific)
      const payload = {
  itemId: id,
  type: packagingType,
  amount: packagingData.amount,
  unit: packagingData.unit,
          ...(packagingType === 'pack' && packagingData.packSize && {
            packSize: packagingData.packSize
  })
};

        console.log('Submitting base/pack packaging:', payload);
      await axios.post(`${backend_url}/packaging/${id}`, payload);
      
        // Refresh packaging data
        const packagingRes = await axios.get(`${backend_url}/packaging/${id}`);
        const packagingArr = packagingRes.data;
        const basePackaging = packagingArr.find(p => p.type === 'base');
        const packPackaging = packagingArr.find(p => p.type === 'pack');
        setItem({
          ...item,
          basePackaging,
          packPackaging
        });
      } else {
        // Handle additional packaging (new system) and sub-packaging
        const payload = {
          itemId: id,
          type: packagingData.type,
          amount: parseFloat(packagingData.amount),
          unit: packagingData.unit,
          packSize: parseInt(packagingData.packSize),
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
        }

        console.log('Submitting additional packaging:', payload);

        if (editingPackagingId) {
          // Update existing additional packaging
          await axios.put(`${backend_url}/packaging/${editingPackagingId}`, payload);
        } else {
          // Create new additional packaging
          await axios.post(`${backend_url}/packaging`, payload);
        }

        // Refresh additional packaging data
        const additionalPackagingRes = await axios.get(`${backend_url}/packaging`).then(res => {
          console.log('Refreshing packaging data:', res.data);
          const filtered = res.data.filter(pkg => {
            if (!pkg.itemId) {
              console.warn('Package with no itemId found:', pkg);
              return false;
            }
            return pkg.itemId._id === id;
          });
          console.log('Filtered packaging after save:', filtered);
          return filtered;
        }).catch(err => {
          console.error('Error refreshing packaging:', err);
          return item.additionalPackaging || [];
        });
        
        setItem({
          ...item,
          additionalPackaging: additionalPackagingRes
        });
      }
      
      setShowPackagingForm(false);
      setEditingPackagingId(null);
      alert('Packaging saved successfully!');
    } catch (err) {
      console.error('Error saving packaging:', err);
      console.error('Error details:', err.response?.data);
      alert(`Error saving packaging: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFormCancel = () => {
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
  };

  const PackagingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#5B2685] mb-4">
          {editingPackagingId ? 'Edit' : 'Add'} Packaging
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
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Parent Packaging
              </label>
              <p className="text-sm text-blue-600">
                {packagingData.parentPackaging.parentDescription}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Creating sub-packaging within this parent package
              </p>
            </div>
          )}

          {/* Packaging Type - Always editable */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Packaging Type *
            </label>
            <input
              type="text"
              value={packagingData.type || ''}
              onChange={(e) => setPackagingData(prev => ({...prev, type: e.target.value}))}
              placeholder="Enter packaging type (e.g., bulk, retail, wholesale, custom)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={(e) => setPackagingData(prev => ({...prev, amount: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="1"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit * (Auto-detected from item)
              </label>
              <input
                type="text"
                value={packagingData.unit}
                onChange={(e) => setPackagingData(prev => ({...prev, unit: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="Unit"
                required
              />
            </div>
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
              Pack Size *
                </label>
                <input
                  type="number"
                  value={packagingData.packSize}
              onChange={(e) => setPackagingData(prev => ({...prev, packSize: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                  placeholder="10"
                  required
                />
              </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
                </label>
            <textarea
              value={packagingData.description}
              onChange={(e) => setPackagingData(prev => ({...prev, description: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              rows="2"
              placeholder="Add packaging description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branches (Multiple selection)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {branches.map(branch => (
                <label key={branch._id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={packagingData.branches.includes(branch._id)}
                    onChange={(e) => {
                      const branchId = branch._id;
                      if (e.target.checked) {
                        setPackagingData(prev => ({
                          ...prev,
                          branches: [...prev.branches, branchId]
                        }));
                      } else {
                        setPackagingData(prev => ({
                          ...prev,
                          branches: prev.branches.filter(id => id !== branchId)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{branch.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brands (Multiple selection)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {brands.map(brand => (
                <label key={brand._id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={packagingData.brands.includes(brand._id)}
                    onChange={(e) => {
                      const brandId = brand._id;
                      if (e.target.checked) {
                        setPackagingData(prev => ({
                          ...prev,
                          brands: [...prev.brands, brandId]
                        }));
                      } else {
                        setPackagingData(prev => ({
                          ...prev,
                          brands: prev.brands.filter(id => id !== brandId)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{brand.nameEn || brand.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          {item?.unitPrice && packagingData.amount && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h6 className="font-medium mb-2 text-green-800">Pricing Calculation</h6>
              <div className="text-sm space-y-1 text-green-700">
                <div className="flex justify-between">
                  <span>Item Unit Price:</span>
                  <span>{item.unitPrice} {item.priceIncludesVAT ? '(Incl. VAT)' : '(Excl. VAT)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Amount:</span>
                  <span>{packagingData.amount} {packagingData.unit}</span>
                </div>
                {packagingData.packSize && (
                  <div className="flex justify-between">
                    <span>Pack Size:</span>
                    <span>{packagingData.packSize}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span>{packagingData.packSize ? (packagingData.amount * (packagingData.packSize || 1)) : packagingData.amount}</span>
                </div>
                <hr className="border-green-300" />
                <div className="flex justify-between font-medium">
                  <span>Total Price:</span>
                  <span>{calculatePackagingPrice(packagingData)}</span>
                </div>
                {item.tax && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Price Excl. VAT:</span>
                      <span>{calculatePriceExcludingVAT(packagingData)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>VAT ({item.tax.rate}%):</span>
                      <span>{calculateVATAmount(packagingData)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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
                onClick={() => handleAddPackaging('new')}
                className="bg-[#5B2685] text-white px-4 py-2 rounded-md hover:bg-[#4A1F6F] transition-colors"
              >
                Add More Packaging
              </button>
            </div>

            {/* Show existing packaging items */}
            <div className="space-y-4">
              {/* Base packaging from unitCount */}
              {item?.unitCount && item?.baseUnit && (
              <div className="border border-[#D9D9D9] rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-[#5B2685] font-bold mb-1">Base (From Item Creation)</h3>
                <p className="text-sm text-gray-800">
                        {item.unitCount} x {item.baseUnit.name} of {item.nameEn || item.name}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Default
                    </span>
                  </div>
                </div>
              )}

              {/* Custom packaging items */}
              {item?.basePackaging && (
                <div className="border border-[#D9D9D9] rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-[#5B2685] font-bold mb-1">Base (Custom)</h3>
                      <p className="text-sm text-gray-800">
                        {item.nameEn || item.name} {item.basePackaging.amount}{item.basePackaging.unit}
                      </p>
                    </div>
                    <div className="flex gap-2">
                <button 
                  onClick={() => handleAddPackaging('base')}
                        className="text-sm text-[#5B2685] hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('base')}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Add Sub-Packaging
                      </button>
                      <button 
                        onClick={() => handleDeleteBasePackaging()}
                        className="text-sm text-red-600 hover:underline"
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
                  onClick={() => handleAddPackaging('pack')}
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
                  // Determine if this is sub-packaging and find its parent
                  let isSubPackaging = false;
                  
                  if (index > 0) {
                    // All packages after the first are sub-packaging of the previous one
                    isSubPackaging = true;
                  }
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
                  <div key={index} className={`border rounded-lg p-4 shadow-sm ${isSubPackaging ? 'border-blue-300 bg-blue-50 ml-8' : 'border-gray-300 bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold mb-1 capitalize ${isSubPackaging ? 'text-blue-700' : 'text-gray-700'}`}>
                          {isSubPackaging && '↳ '}{pkg.type}
                        </h3>
                        <p className="text-sm text-gray-800">
                          {isSubPackaging ? (
                            `${fullMultiplicationDesc} = ${totalUnits.toLocaleString()} total units`
                          ) : (
                            `${pkg.packSize ? `${pkg.packSize} x ` : ''}${pkg.amount} ${pkg.unit}`
                          )}
                        </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                      )}
                      
                      {/* Pricing Information */}
                      {item.unitPrice && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex justify-between">
                            <span>Base Units:</span>
                            <span>{baseUnits}</span>
                          </div>
                          {isSubPackaging && (
                            <div className="flex justify-between text-blue-600">
                              <span>Total Units (with parent):</span>
                              <span>{totalUnits}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Total Price:</span>
                            <span>{calculatePackagingPrice({...pkg, amount: isSubPackaging ? totalUnits : pkg.amount, packSize: 1})}</span>
                          </div>
                          {item.tax && (
                            <div className="flex justify-between text-gray-600">
                              <span>VAT ({item.tax.rate}%):</span>
                              <span>{calculateVATAmount({...pkg, amount: isSubPackaging ? totalUnits : pkg.amount, packSize: 1})}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleEditAdditionalPackaging(pkg)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleAddSubPackaging('additional', pkg)}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Add Sub-Packaging
                      </button>
                      <button 
                        onClick={() => handleDeleteAdditionalPackaging(pkg._id)}
                        className="text-sm text-red-600 hover:underline"
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
                    <th className="p-2 text-left">Unit Price Incl. Tax (SAR)</th>
                    <th className="p-2 text-left">Total Units</th>
                    <th className="p-2 text-left">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base packaging rows - one for each selected supplier */}
                  {item?.unitCount && item?.baseUnit && item?.unitPrice && (
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
                              <td className="p-2">Item Code</td>
                              <td className="p-2">{item.baseUnit.name}</td>
                              <td className="p-2 text-center">
                                {item.priceIncludesVAT ? 
                                  calculatePriceExcludingVAT({amount: 1, packSize: 1}) :
                                  item.unitPrice
                                }
                              </td>
                              <td className="p-2 text-center">
                                {item.priceIncludesVAT ? 
                                  item.unitPrice :
                                  calculateUnitPriceIncludingTax()
                                }
                              </td>
                              <td className="p-2 text-center">{item.unitCount}</td>
                              <td className="p-2 text-center">
                                <input type="checkbox" className="accent-[#5B2685]" />
                              </td>
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
                          <td className="p-2 text-gray-400" colSpan="7">Select suppliers to see pricing details</td>
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
                          <td className="p-2" colSpan="7"></td>
                        </tr>
                      )}
                    </>
                  )}
                  
                  {/* Pack packaging rows - one for each selected supplier */}
                  {item?.packPackaging && item?.unitPrice && (
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
                    <td className="p-2">Item Code</td>
                              <td className="p-2">{item.packPackaging.packSize} x {item.packPackaging.unit}</td>
                              <td className="p-2 text-center">
                                {item.priceIncludesVAT ? 
                                  calculatePriceExcludingVAT({amount: 1, packSize: 1}) :
                                  item.unitPrice
                                }
                              </td>
                              <td className="p-2 text-center">
                                {item.priceIncludesVAT ? 
                                  item.unitPrice :
                                  calculateUnitPriceIncludingTax()
                                }
                              </td>
                              <td className="p-2 text-center">{item.packPackaging.packSize * item.packPackaging.amount}</td>
                              <td className="p-2 text-center">
                                <input type="checkbox" className="accent-[#5B2685]" />
                              </td>
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
                          <td className="p-2 text-gray-400" colSpan="7">Select suppliers to see pricing details</td>
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
                          <td className="p-2" colSpan="7"></td>
                        </tr>
                      )}
                    </>
                  )}

                                {/* Additional packaging rows with hierarchical display */}
              {item?.additionalPackaging && item?.unitPrice && item.additionalPackaging.map((pkg, index) => {
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
                
                const packagingKey = `additional_${index}`;
                
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
                            <td className="p-2">Item Code</td>
                            <td className="p-2">{pkg.unit}</td>
                            <td className="p-2 text-center">
                              {item.priceIncludesVAT ? 
                                calculatePriceExcludingVAT({amount: 1, packSize: 1}) :
                                item.unitPrice
                              }
                            </td>
                            <td className="p-2 text-center">
                              {item.priceIncludesVAT ? 
                                item.unitPrice :
                                calculateUnitPriceIncludingTax()
                              }
                            </td>
                            <td className="p-2 text-center">
                              <span className="font-medium">{totalUnits}</span>
                              <div className="text-xs text-gray-500">
                                Total Available
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <input type="checkbox" className="accent-[#5B2685]" />
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
                        <td className="p-2 text-gray-400" colSpan="7">Select suppliers</td>
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
                        <td className="p-2" colSpan="7"></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

                  {/* Show message when no pricing available */}
                  {!item?.unitPrice && (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-500">
                        No unit price set for this item. Please add unit price in the Item Details tab to see supplier pricing calculations.
                      </td>
                    </tr>
                  )}

                  {/* Show message when no packaging available */}
                  {item?.unitPrice && !item?.unitCount && !item?.packPackaging && (!item?.additionalPackaging || item.additionalPackaging.length === 0) && (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-500">
                        No packaging configured. Please add packaging in the Packaging tab to see supplier pricing.
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
            onClick={() => setActiveTab(tab)}
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