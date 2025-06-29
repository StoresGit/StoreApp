import React, { useEffect, useState } from 'react';
import ItemDetailsForm from './MainContent/ItemDetailForm';
import LocationTogglePanel from './MainContent/LocationTogglePanel';
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
  const [packagingData, setPackagingData] = useState({
    amount: '',
    unit: 'L',
    packSize: '',
    packUnit: ''
  });
  const [editingPackagingId, setEditingPackagingId] = useState(null);

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

  if (!item) return <div className="p-4">Loading item...</div>;

  const handleAddPackaging = (type) => {
    if (type === 'new') {
      // Open modal for new packaging type
      setPackagingType('bulk'); // Default to bulk for new packaging
    } else {
      setPackagingType(type);
    }
    setShowPackagingForm(true);
    setPackagingData({
      amount: '',
      unit: 'pcs',
      packSize: '',
      packUnit: 'x'
    });
  };

  const handleEditAdditionalPackaging = (packaging) => {
    setPackagingType(packaging.type);
    setPackagingData({
      amount: packaging.amount.toString(),
      unit: packaging.unit,
      packSize: packaging.packSize?.toString() || '',
      packUnit: packaging.packUnit || 'x'
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
    if (!packagingData.amount || !packagingData.unit) {
      alert('Please fill in amount and unit');
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
            packSize: packagingData.packSize,
            packUnit: packagingData.packUnit
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
        // Handle additional packaging (new system)
        const payload = {
          itemId: id,
          type: packagingType,
          amount: parseFloat(packagingData.amount),
          unit: packagingData.unit,
          ...(packagingData.packSize && {
            packSize: parseInt(packagingData.packSize),
            packUnit: packagingData.packUnit
          })
        };

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
      unit: 'pcs',
      packSize: '',
      packUnit: 'x'
    });
  };

  const PackagingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-lg">
        <h3 className="text-lg font-semibold text-[#5B2685] mb-4">
          {editingPackagingId ? 'Edit' : 'Add'} {packagingType === 'base' ? 'Base' : packagingType === 'pack' ? 'Pack' : 'Additional'} Packaging
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

          {/* Show type selector for new packaging */}
          {packagingType !== 'base' && packagingType !== 'pack' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packaging Type
              </label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              >
                <option value="bulk">Bulk</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={packagingData.amount}
                onChange={(e) => setPackagingData({...packagingData, amount: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="1"
                required 
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={packagingData.unit}
                onChange={(e) => setPackagingData({...packagingData, unit: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              >
                <option value="pcs">pcs</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pack Size {packagingType === 'pack' ? '*' : '(Optional)'}
              </label>
              <input
                type="number"
                value={packagingData.packSize}
                onChange={(e) => setPackagingData({...packagingData, packSize: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
                placeholder="10"
                required={packagingType === 'pack'}
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pack Unit
              </label>
              <select
                value={packagingData.packUnit}
                onChange={(e) => setPackagingData({...packagingData, packUnit: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5B2685] focus:border-transparent"
              >
                <option value="x">x</option>
                <option value="per">per</option>
                <option value="of">of</option>
              </select>
            </div>
          </div>

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
        return <div className="flex gap-6 mt-6">
          <ItemDetailsForm item={item}/>
          <LocationTogglePanel />
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
                        onClick={() => handleDeletePackPackaging()}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional packaging items from Packaging collection */}
              {item?.additionalPackaging && item.additionalPackaging.map((pkg, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-gray-700 font-bold mb-1 capitalize">{pkg.type}</h3>
                      <p className="text-sm text-gray-800">
                        {pkg.packSize ? `${pkg.packSize} ${pkg.packUnit} ` : ''}{pkg.amount} {pkg.unit}
                      </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditAdditionalPackaging(pkg)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
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
              ))}

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
                    <th className="p-2 text-left">Supplier Item Name</th>
                    <th className="p-2 text-left">Supplier Item Code</th>
                    <th className="p-2 text-left">Pricing UOM</th>
                    <th className="p-2 text-left">Unit Price (SAR)</th>
                    <th className="p-2 text-left">Total Units</th>
                    <th className="p-2 text-left">Total Price (SAR)</th>
                    <th className="p-2 text-left">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base packaging row */}
                  {item?.unitCount && item?.baseUnit && (
                    <tr className="border-t border-gray-200">
                      <td className="p-2">{item.unitCount} x {item.baseUnit.name} of {item.nameEn || item.name}</td>
                      <td className="p-2">Budget Foods</td>
                      <td className="p-2">{item.nameEn || item.name}</td>
                      <td className="p-2">Item Code</td>
                      <td className="p-2">{item.baseUnit.name}</td>
                      <td className="p-2">10.00</td>
                      <td className="p-2">{item.unitCount}</td>
                      <td className="p-2">{(item.unitCount * 10.00).toFixed(2)}</td>
                      <td className="p-2">
                        <input type="checkbox" checked readOnly className="accent-[#5B2685]" />
                      </td>
                    </tr>
                  )}
                  
                  {/* Pack packaging row */}
                  {item?.packPackaging && (
                    <tr className="border-t border-gray-200">
                      <td className="p-2">{item.nameEn || item.name} {item.packPackaging.packSize} x {item.packPackaging.amount}{item.packPackaging.unit}</td>
                      <td className="p-2">Budget Foods</td>
                      <td className="p-2">{item.nameEn || item.name}</td>
                      <td className="p-2">Item Code</td>
                      <td className="p-2">{item.packPackaging.packSize} x {item.packPackaging.unit}</td>
                      <td className="p-2">130.00</td>
                      <td className="p-2">{item.packPackaging.packSize * item.packPackaging.amount}</td>
                      <td className="p-2">{(item.packPackaging.packSize * item.packPackaging.amount * 130.00).toFixed(2)}</td>
                      <td className="p-2">
                        <input type="checkbox" readOnly className="accent-[#5B2685]" />
                      </td>
                    </tr>
                  )}

                  {/* Additional packaging rows */}
                  {item?.additionalPackaging && item.additionalPackaging.map((pkg, index) => {
                    const totalUnits = pkg.packSize ? (pkg.packSize * pkg.amount) : pkg.amount;
                    const unitPrice = 15.00; // Example price
                    const totalPrice = totalUnits * unitPrice;
                    
                    return (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="p-2">
                          {pkg.packSize ? `${pkg.packSize} ${pkg.packUnit} ` : ''}{pkg.amount} {pkg.unit} of {item.nameEn || item.name}
                        </td>
                        <td className="p-2">Budget Foods</td>
                        <td className="p-2">{item.nameEn || item.name}</td>
                        <td className="p-2">Item Code</td>
                        <td className="p-2">{pkg.unit}</td>
                        <td className="p-2">{unitPrice.toFixed(2)}</td>
                        <td className="p-2">{totalUnits}</td>
                        <td className="p-2">{totalPrice.toFixed(2)}</td>
                        <td className="p-2">
                          <input type="checkbox" readOnly className="accent-[#5B2685]" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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