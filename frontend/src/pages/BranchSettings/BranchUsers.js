import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const BranchUsers = () => {
  const { isMasterAdmin } = useAuth();
  const [formData, setFormData] = useState({
    branchName: '',
    employeeName: '',
    username: '',
    password: '',
    section: []
  });

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, branchesRes, sectionsRes] = await Promise.all([
        axios.get(`${backend_url}/users`, { headers }),
        axios.get(`${backend_url}/branch`, { headers }),
        axios.get(`${backend_url}/sections`, { headers })
      ]);

      // Filter users to only show branch-specific users (not master admin)
      const branchUsers = usersRes.data.filter(user => user.branch && !user.isMasterAdmin);
      setUsers(branchUsers);
      setBranches(branchesRes.data);
      
      // Filter sections to only show branch-specific sections from BranchSection page
      const branchSections = sectionsRes.data.filter(section => section.branch);
      setSections(branchSections);
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

  const handleSectionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      section: checked
        ? [...prev.section, value]
        : prev.section.filter(section => section !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeName || !formData.username || !formData.password || !formData.branchName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const userData = {
        name: formData.employeeName,
        email: formData.username + '@gmail.com',
        password: formData.password,
        role: 'user',
        branch: formData.branchName,
        sections: formData.section
      };

      await axios.post(`${backend_url}/users`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setFormData({
        branchName: '',
        employeeName: '',
        username: '',
        password: '',
        section: []
      });
      
      // Refresh data
      await fetchData();
      
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!isMasterAdmin()) {
      alert('Only Master Admin can delete users');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${backend_url}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchData();
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    if (!isMasterAdmin()) {
      alert('Only Master Admin can deactivate users');
      return;
    }

    if (window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${backend_url}/users/${userId}`, {
          isActive: !isActive
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchData();
        alert(`User ${isActive ? 'deactivated' : 'activated'} successfully!`);
      } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-200 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold text-black">Branch Users</h1>
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

          {/* Employee Name */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Employee Name:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter employee name"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Employee name</div>
          </div>

          {/* Username */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Username:</div>
            <div className="col-span-2">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter username (will add @gmail.com)"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Username (will be username@gmail.com)</div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-medium text-gray-700">Password:</div>
            <div className="col-span-2">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter password"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Password</div>
          </div>

          {/* Section Selection */}
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="font-medium text-gray-700">Section:</div>
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-2">
                {sections.map((section) => (
                  <label key={section._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={section._id}
                      checked={formData.section.includes(section._id)}
                      onChange={handleSectionChange}
                      className="rounded"
                    />
                    <span className="text-sm">{section.name} ({section.branch?.name})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Select sections for this user</div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>

        {/* Users List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Branch Users</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <div className="grid grid-cols-6 gap-4">
                <div className="font-semibold text-gray-700">NAME</div>
                <div className="font-semibold text-gray-700">EMAIL</div>
                <div className="font-semibold text-gray-700">BRANCH</div>
                <div className="font-semibold text-gray-700">SECTIONS</div>
                <div className="font-semibold text-gray-700">STATUS</div>
                <div className="font-semibold text-gray-700">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user._id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="text-gray-800">{user.name}</div>
                    <div className="text-gray-600">{user.email}</div>
                    <div className="text-gray-600">{user.branch?.name || 'N/A'}</div>
                    <div className="text-gray-600">
                      {user.sections?.map(section => section.name).join(', ') || 'N/A'}
                    </div>
                    <div className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="flex items-center gap-2">
                      {isMasterAdmin() && (
                        <>
                          <button
                            onClick={() => updateUserStatus(user._id, user.isActive)}
                            className={`text-sm px-2 py-1 rounded ${
                              user.isActive 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </>
                      )}
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

export default BranchUsers; 