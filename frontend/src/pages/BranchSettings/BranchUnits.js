import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const BranchUnits = () => {
  const [formData, setFormData] = useState({
    unitName: '',
    baseUnit: '',
    symbol: '',
    branchName: ''
  });

  const [units, setUnits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [unitsRes, branchesRes] = await Promise.all([
        axios.get(`${backend_url}/units`, { headers }),
        axios.get(`${backend_url}/branch`, { headers })
      ]);

      // Show all units initially, but prefer branch-specific ones
      const allUnits = unitsRes.data;
      setUnits(allUnits);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + (error.response?.data?.error || error.message));
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
    if (formData.unitName && formData.baseUnit && formData.symbol && formData.branchName) {
      try {
        const token = localStorage.getItem('token');
        const unitData = {
          name: formData.unitName,
          baseUnit: formData.baseUnit,
          symbol: formData.symbol,
          branch: formData.branchName
        };

        if (editingUnit) {
          // Update existing unit
          await axios.put(`${backend_url}/units/${editingUnit._id}`, unitData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEditingUnit(null);
        } else {
          // Create new unit
          await axios.post(`${backend_url}/units`, unitData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Reset form and refresh units
        setFormData({
          unitName: '',
          baseUnit: '',
          symbol: '',
          branchName: ''
        });
        fetchData();
        
        // Show success message
        alert(editingUnit ? 'Unit updated successfully!' : 'Unit created successfully!');
      } catch (error) {
        console.error('Error creating/updating unit:', error);
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const editUnit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitName: unit.name,
      baseUnit: unit.baseUnit || '',
      symbol: unit.symbol,
      branchName: unit.branch?._id || ''
    });
  };

  const cancelEdit = () => {
    setEditingUnit(null);
    setFormData({
      unitName: '',
      baseUnit: '',
      symbol: '',
      branchName: ''
    });
  };

  const deleteUnit = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${backend_url}/units/${unitId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error deleting unit:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading units...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Branch Units</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* Branch Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Branch Name:</div>
            <div className="col-span-2">
              <select
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Non-Editable - Drop down menu to select branch (Selectable)</div>
          </div>

          {/* Unit Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Unit Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="unitName"
                value={formData.unitName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter unit name"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Unit name</div>
          </div>

          {/* Base Unit */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Base Unit:</div>
            <div className="col-span-2">
              <select
                name="baseUnit"
                value={formData.baseUnit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Base Unit</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter (liter)</option>
                <option value="pieces">Pieces (pieces)</option>
              </select>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Non-Editable - Drop down menu to select base units (kg / liter / pieces) (Selectable)</div>
          </div>

          {/* Symbol */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Symbol:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter symbol"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Symbol</div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6 gap-2">
            {editingUnit && (
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
              {editingUnit ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>

        {/* Existing Units Table */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Branch Units</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <div className="grid grid-cols-5 gap-4">
                <div className="font-semibold text-gray-700">BRANCH</div>
                <div className="font-semibold text-gray-700">UNIT NAME</div>
                <div className="font-semibold text-gray-700">BASE UNIT</div>
                <div className="font-semibold text-gray-700">SYMBOL</div>
                <div className="font-semibold text-gray-700">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {units.map((unit) => (
                <div key={unit._id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="text-gray-800">{unit.branch?.name || 'N/A'}</div>
                    <div className="text-gray-800">{unit.name}</div>
                    <div className="text-gray-600">{unit.baseUnit || 'N/A'}</div>
                    <div className="text-gray-600">{unit.symbol}</div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => editUnit(unit)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit unit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteUnit(unit._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete unit"
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

export default BranchUnits; 