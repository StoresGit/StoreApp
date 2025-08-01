import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const CreateItem = () => {
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    itemCategory: '',
    unit: '',
    assignBranch: '',
    assignSection: '',
    assignBranchCheckbox: false,
    assignSectionCheckbox: false
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    
    // Check for pending unit data from Units page
    const pendingUnitData = localStorage.getItem('pendingUnitData');
    if (pendingUnitData) {
      try {
        const unitData = JSON.parse(pendingUnitData);
        
        // Auto-populate the form with unit data
        setFormData(prev => ({
          ...prev,
          itemName: unitData.name,
          unit: unitData.name, // Use unit name as item name
          assignBranchCheckbox: true,
          assignBranch: unitData.unitType.replace('branch-', '') // Extract branch ID
        }));
        
        // Clear the pending data
        localStorage.removeItem('pendingUnitData');
        
        // Show notification
        alert('Unit data has been transferred from Units page. Please complete the item creation.');
      } catch (error) {
        console.error('Error parsing pending unit data:', error);
        localStorage.removeItem('pendingUnitData');
      }
    }
    
    // Check for pending section data from Sections page
    const pendingSectionData = localStorage.getItem('pendingSectionData');
    if (pendingSectionData) {
      try {
        const sectionData = JSON.parse(pendingSectionData);
        
        // Auto-populate the form with section data
        setFormData(prev => ({
          ...prev,
          itemName: sectionData.name,
          assignSectionCheckbox: true,
          assignSection: sectionData.name, // Use section name
          assignBranchCheckbox: true,
          assignBranch: sectionData.sectionType.replace('branch-', '') // Extract branch ID
        }));
        
        // Clear the pending data
        localStorage.removeItem('pendingSectionData');
        
        // Show notification
        alert('Section data has been transferred from Sections page. Please complete the item creation.');
      } catch (error) {
        console.error('Error parsing pending section data:', error);
        localStorage.removeItem('pendingSectionData');
      }
    }
  }, []);

  // Filter sections when branch changes
  useEffect(() => {
    if (formData.assignBranch) {
      // Filter sections for the selected branch
      const branchSections = sections.filter(section => 
        section.branch === formData.assignBranch || section.branch?._id === formData.assignBranch
      );
      setFilteredSections(branchSections);
    } else {
      // If no branch selected, show all sections
      setFilteredSections(sections);
    }
  }, [formData.assignBranch, sections]);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [categoriesRes, unitsRes, branchesRes, sectionsRes] = await Promise.all([
        axios.get(`${backend_url}/item-categories`, { headers }),
        axios.get(`${backend_url}/units`, { headers }),
        axios.get(`${backend_url}/branch`, { headers }),
        axios.get(`${backend_url}/sections`, { headers })
      ]);

      // Show all available data initially, but prefer branch-specific data
      const allCategories = categoriesRes.data;
      const allUnits = unitsRes.data;
      const allSections = sectionsRes.data;

      setCategories(allCategories);
      setUnits(allUnits);
      setBranches(branchesRes.data);
      setSections(allSections);
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
    if (formData.itemName && formData.itemCategory && formData.unit) {
      try {
        const token = localStorage.getItem('token');
        const itemData = {
          nameEn: formData.itemName, // Changed from name to nameEn
          name: formData.itemName, // Keep name for compatibility
          category: formData.itemCategory,
          unit: formData.unit,
          baseUnit: formData.unit, // Add baseUnit field
          assignBranch: formData.assignBranch || undefined,
          subCategory: formData.itemCategory, // Use category as subCategory for now
          departments: formData.assignSection ? [formData.assignSection] : []
        };

        await axios.post(`${backend_url}/items`, itemData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Reset form
        setFormData({
          itemCode: '',
          itemName: '',
          itemCategory: '',
          unit: '',
          assignBranch: '',
          assignSection: ''
        });
        
        // Show success message
        alert('Item created successfully!');
      } catch (error) {
        console.error('Error creating item:', error);
        alert('Error creating item: ' + (error.response?.data?.message || error.message));
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Create Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* Item Code */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Code:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="itemCode"
                value={formData.itemCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Auto generated"
                disabled
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Auto generated</div>
          </div>

          {/* Item Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter item name"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Item Name</div>
          </div>

          {/* Item Category */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Category:</div>
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              />
              <select
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Category</option>
                {filteredCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.nameEn || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Searchable - Drop down Menu (Selectable)</div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Unit:</div>
            <div className="col-span-2">
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Non-Editable - Drop down Menu (Selectable)</div>
          </div>

          {/* Assign Branch Checkbox */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Branch:</div>
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="assignBranchCheckbox"
                  checked={formData.assignBranchCheckbox}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    assignBranchCheckbox: e.target.checked,
                    assignBranch: e.target.checked ? prev.assignBranch : ''
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable Branch Assignment</span>
              </label>
              {formData.assignBranchCheckbox && (
                <select
                  name="assignBranch"
                  value={formData.assignBranch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  required={formData.assignBranchCheckbox}
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-span-3 text-sm text-gray-600">Checkbox to enable branch assignment</div>
          </div>

          {/* Assign Section Checkbox */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Section:</div>
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="assignSectionCheckbox"
                  checked={formData.assignSectionCheckbox}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    assignSectionCheckbox: e.target.checked,
                    assignSection: e.target.checked ? prev.assignSection : ''
                  }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable Section Assignment</span>
              </label>
              {formData.assignSectionCheckbox && (
                <select
                  name="assignSection"
                  value={formData.assignSection}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  required={formData.assignSectionCheckbox}
                  disabled={!formData.assignBranch}
                >
                  <option value="">Select Section</option>
                  {filteredSections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-span-3 text-sm text-gray-600">Checkbox to enable section assignment</div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button 
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItem; 