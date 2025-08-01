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
    assignSection: ''
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter sections when branch changes
  useEffect(() => {
    if (formData.assignBranch) {
      // Filter sections for the selected branch
      const branchSections = sections.filter(section => 
        section.branch === formData.assignBranch || 
        section.branch?._id === formData.assignBranch ||
        section.branch?.toString() === formData.assignBranch
      );
      setFilteredSections(branchSections.length > 0 ? branchSections : sections);
    } else {
      // If no branch selected, show all sections
      setFilteredSections(sections);
    }
  }, [formData.assignBranch, sections]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [categoriesRes, unitsRes, branchesRes, sectionsRes] = await Promise.all([
        axios.get(`${backend_url}/item-categories`, { headers }),
        axios.get(`${backend_url}/units`, { headers }),
        axios.get(`${backend_url}/branch`, { headers }),
        axios.get(`${backend_url}/sections`, { headers })
      ]);

      console.log('Categories fetched:', categoriesRes.data);
      console.log('Units fetched:', unitsRes.data);
      console.log('Branches fetched:', branchesRes.data);
      console.log('Sections fetched:', sectionsRes.data);

      // Show all available data
      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
      setBranches(branchesRes.data);
      setSections(sectionsRes.data);
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
          </div>

          {/* Item Category */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Item Category:</div>
            <div className="col-span-2">
              <select
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.nameEn || category.name || category.nameUr}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Assign Branch */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Branch:</div>
            <div className="col-span-2">
              <select
                name="assignBranch"
                value={formData.assignBranch}
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
          </div>

          {/* Assign Section */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Assign Section:</div>
            <div className="col-span-2">
              <select
                name="assignSection"
                value={formData.assignSection}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Section</option>
                {filteredSections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name} {section.branch ? `(${section.branch.name || section.branch})` : ''}
                  </option>
                ))}
              </select>
            </div>
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