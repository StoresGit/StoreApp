import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../../config/config';

const BranchUsers = () => {
  const [formData, setFormData] = useState({
    branchName: '',
    employeeName: '',
    username: '',
    password: '',
    section: []
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);

  // Fetch users from database
  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchSections();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/branch`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/sections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
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
        : prev.section.filter(s => s !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.employeeName && formData.username && formData.password) {
      try {
        const token = localStorage.getItem('token');
        const userData = {
          name: formData.employeeName,
          email: formData.username + '@gmail.com', // Enforce @gmail.com
          password: formData.password,
          role: 'user',
          branch: formData.branchName,
          sections: formData.section
        };

        await axios.post(`${backend_url}/users`, userData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Reset form and refresh users
        setFormData({
          branchName: '',
          employeeName: '',
          username: '',
          password: '',
          section: []
        });
        fetchUsers();
      } catch (error) {
        console.error('Error creating user:', error);
      }
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${backend_url}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${backend_url}/users/${userId}`, {
        isActive: !isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
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
            <div className="col-span-3 text-sm text-gray-600">Editable - Drop down menu to select branch</div>
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
            <div className="col-span-3 text-sm text-gray-600">Editable - Employee Name</div>
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
                placeholder="Create username"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Create Username (will be username@gmail.com)</div>
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
                placeholder="Create password"
                required
              />
            </div>
            <div className="col-span-3 text-sm text-gray-600">Create Password</div>
          </div>

          {/* Section */}
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="font-medium text-gray-700">Section:</div>
            <div className="col-span-2">
              <div className="space-y-2">
                {sections.map((section) => (
                  <label key={section._id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="section"
                      value={section._id}
                      checked={formData.section.includes(section._id)}
                      onChange={handleSectionChange}
                      className="mr-2"
                    />
                    <span className="text-gray-600">{section.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-3 text-sm text-gray-600">Editable - Select multiple sections to give access to employee</div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button 
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>

        {/* Existing Users Table */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Users</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <div className="grid grid-cols-6 gap-4">
                <div className="font-semibold text-gray-700">BRANCH</div>
                <div className="font-semibold text-gray-700">EMPLOYEE NAME</div>
                <div className="font-semibold text-gray-700">USERNAME</div>
                <div className="font-semibold text-gray-700">SECTIONS</div>
                <div className="font-semibold text-gray-700">STATUS</div>
                <div className="font-semibold text-gray-700">ACTIONS</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user._id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="text-gray-800">{user.branch?.name || 'N/A'}</div>
                    <div className="text-gray-800">{user.name}</div>
                    <div className="text-gray-600">{user.email}</div>
                    <div className="text-gray-600">
                      {user.sections?.map(section => section.name).join(', ') || 'No sections'}
                    </div>
                    <div className={`${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateUserStatus(user._id, user.isActive)}
                        className={`px-2 py-1 rounded text-xs ${
                          user.isActive 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
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