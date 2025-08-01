import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', 
    baseUnit: '', 
    standardUnit: '', 
    symbol: '',
    unitType: '' // New field for unit type
  });
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState(null);

  // Base units that are allowed
  const baseUnits = ['kg', 'liter', 'pieces'];

  useEffect(() => {
    fetchUnits();
    fetchBranches();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${backend_url}/units`);
      setUnits(res.data);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${backend_url}/branch`);
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUnit = async () => {
    if (formData.name.trim() && formData.baseUnit.trim() && formData.symbol.trim() && formData.unitType.trim()) {
      try {
        // If branch unit is selected, redirect to Create Item page
        if (formData.unitType.startsWith('branch-')) {
          // Store the unit data in localStorage for Create Item page
          localStorage.setItem('pendingUnitData', JSON.stringify({
            name: formData.name,
            baseUnit: formData.baseUnit,
            symbol: formData.symbol,
            standardUnit: formData.standardUnit,
            unitType: formData.unitType
          }));
          
          // Redirect to Create Item page
          window.location.href = '/branch-settings/create-item';
          return;
        }
        
        // For standard units, show confirmation
        if (formData.unitType === 'standard') {
          const confirmed = window.confirm('Are you sure you want to create a Standard Unit? Operations are running.');
          if (!confirmed) {
            return;
          }
        }
        
        await axios.post(`${backend_url}/units`, formData);
        closeModal();
        fetchUnits();
        alert('Unit created successfully!');
      } catch (err) {
        console.error('Failed to add unit:', err);
        alert('Failed to add unit. Please check your input.');
      }
    } else {
      alert('Name, Base Unit, Symbol, and Unit Type are required fields.');
    }
  };

  const handleUpdateUnit = async () => {
    if (formData.name.trim() && formData.baseUnit.trim() && formData.symbol.trim() && formData.unitType.trim() && currentUnitId) {
      try {
        // If branch unit is selected, redirect to Create Item page
        if (formData.unitType.startsWith('branch-')) {
          // Store the unit data in localStorage for Create Item page
          localStorage.setItem('pendingUnitData', JSON.stringify({
            name: formData.name,
            baseUnit: formData.baseUnit,
            symbol: formData.symbol,
            standardUnit: formData.standardUnit,
            unitType: formData.unitType,
            isUpdate: true,
            unitId: currentUnitId
          }));
          
          // Redirect to Create Item page
          window.location.href = '/branch-settings/create-item';
          return;
        }
        
        // For standard units, show confirmation
        if (formData.unitType === 'standard') {
          const confirmed = window.confirm('Are you sure you want to update to Standard Unit? Operations are running.');
          if (!confirmed) {
            return;
          }
        }
        
        await axios.put(`${backend_url}/units/${currentUnitId}`, formData);
        closeModal();
        fetchUnits();
        alert('Unit updated successfully!');
      } catch (err) {
        console.error('Failed to update unit:', err);
        alert('Failed to update unit. Please check your input.');
      }
    } else {
      alert('Name, Base Unit, Symbol, and Unit Type are required fields.');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this unit?");
    if (confirmDelete) {
      try {
        await axios.delete(`${backend_url}/units/${id}`);
        fetchUnits();
      } catch (err) {
        console.error('Failed to delete unit:', err);
        alert('Failed to delete unit.');
      }
    }
  };

  const openEditModal = (unit) => {
    setEditMode(true);
    setCurrentUnitId(unit._id);
    setFormData({ 
      name: unit.name, 
      baseUnit: unit.baseUnit, 
      standardUnit: unit.standardUnit || '', 
      symbol: unit.symbol || unit.Symbol, // Handle both old and new field names
      unitType: unit.unitType || 'standard' // Default to standard if not set
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setFormData({ 
      name: '', 
      baseUnit: '', 
      standardUnit: '', 
      symbol: '',
      unitType: ''
    });
    setShowModal(false);
    setEditMode(false);
    setCurrentUnitId(null);
  };

  return (
    <div className="p-4 z-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Units Management</h2>
        <button
          className="bg-[#735dff] text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Add Unit
        </button>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 text-sm">
          Manage your units based on the three base units: kg (weight), liter (volume), and pieces (count).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Base Unit</th>
              <th className="p-2 border text-left">Unit Type</th>
              <th className="p-2 border text-left">Standard Unit</th>
              <th className="p-2 border text-left">Symbol</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit._id} className="hover:bg-gray-50">
                <td className="p-2 border font-medium">{unit.name}</td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    unit.baseUnit === 'kg' ? 'bg-green-100 text-green-800' :
                    unit.baseUnit === 'liter' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {unit.baseUnit}
                  </span>
                </td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    unit.unitType === 'branch' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {unit.unitType || 'standard'}
                  </span>
                </td>
                <td className="p-2 border">{unit.standardUnit || '-'}</td>
                <td className="p-2 border">{unit.symbol || unit.Symbol}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => openEditModal(unit)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(unit._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No units found. Add your first unit to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-1/2 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editMode ? 'Edit Unit' : 'Add New Unit'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter unit name (e.g., kg, gram, liter, ml, pieces)"
                  className="w-full border p-2 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Unit *
                </label>
                <select
                  name="baseUnit"
                  value={formData.baseUnit}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Base Unit *</option>
                  {baseUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the base unit this unit belongs to: kg (weight), liter (volume), or pieces (count)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Type *
                </label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Unit Type *</option>
                  <option value="standard">Standard Unit</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={`branch-${branch._id}`}>
                      Branch Unit - {branch.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose whether this is a standard unit or a branch-specific unit
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Unit (Optional)
                </label>
                <input
                  type="text"
                  name="standardUnit"
                  value={formData.standardUnit}
                  onChange={handleChange}
                  placeholder="Standard Unit (optional)"
                  className="w-full border p-2 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol *
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="Enter symbol (e.g., kg, L, pcs)"
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="text-gray-500 hover:underline">
                Cancel
              </button>
              <button
                onClick={editMode ? handleUpdateUnit : handleAddUnit}
                className="bg-[#735dff] text-white px-4 py-2 rounded hover:bg-[#5a4bcc]"
              >
                {editMode ? 'Update' : 'Add'} Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
