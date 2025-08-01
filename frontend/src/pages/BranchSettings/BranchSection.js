import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const BranchSection = () => {
  const [formData, setFormData] = useState({
    branchName: '',
    sectionName: ''
  });

  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [sectionsRes, branchesRes] = await Promise.all([
        axios.get(`${backend_url}/sections`, { headers }),
        axios.get(`${backend_url}/branch`, { headers })
      ]);

      setSections(sectionsRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    if (formData.branchName && formData.sectionName) {
      try {
        const token = localStorage.getItem('token');
        const sectionData = {
          name: formData.sectionName,
          branch: formData.branchName,
          code: formData.sectionName.toUpperCase().substring(0, 6), // Auto-generate code
          description: `Section: ${formData.sectionName}`,
          isActive: true
        };

        if (editingSection) {
          // Update existing section
          await axios.put(`${backend_url}/sections/${editingSection._id}`, sectionData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEditingSection(null);
        } else {
          // Create new section
          await axios.post(`${backend_url}/sections`, sectionData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Reset form and refresh sections
        setFormData({
          branchName: '',
          sectionName: ''
        });
        fetchData();
        
        // Show success message
        alert(editingSection ? 'Section updated successfully!' : 'Section created successfully!');
      } catch (error) {
        console.error('Error creating/updating section:', error);
        alert('Error: ' + (error.response?.data?.message || error.message));
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const editSection = (section) => {
    setEditingSection(section);
    setFormData({
      branchName: section.branch?._id || '',
      sectionName: section.name
    });
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setFormData({
      branchName: '',
      sectionName: ''
    });
  };

  const deleteSection = async (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${backend_url}/sections/${sectionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading sections...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Branch Section</h1>
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
          </div>

          {/* Section Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Section Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="sectionName"
                value={formData.sectionName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter section name"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6 gap-2">
            {editingSection && (
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
              {editingSection ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>

        {/* Existing Sections Table */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Sections</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <div className="grid grid-cols-4 gap-4">
                <div className="font-semibold text-gray-700">BRANCH</div>
                <div className="font-semibold text-gray-700">SECTION NAME</div>
                <div className="font-semibold text-gray-700">STATUS</div>
                <div className="font-semibold text-gray-700">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {sections.map((section) => (
                <div key={section._id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="text-gray-800">{section.branch?.name || 'N/A'}</div>
                    <div className="text-gray-800">{section.name}</div>
                    <div className={`${section.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {section.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => editSection(section)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit section"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteSection(section._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete section"
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

export default BranchSection; 