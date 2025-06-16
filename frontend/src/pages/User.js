import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const User = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  // const [departments, setDepartments] = useState([]) .;
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    branch: '',
    departments: [],
    loginPin: '',
    biometricId: ''
  });
  // const [branches,setBranches] = useState([])

  const fetchUsers = async () => {
    const res = await axios.get(`${backend_url}/users`);
    setUsers(res.data);
  };

 const fetchRolesAndBranches = async () => {
  const [rolesRes] = await Promise.all([
    axios.get(`${backend_url}/roles`)
  ]);
  setRoles(rolesRes.data);
};

useEffect(() => {
  fetchUsers();
  fetchRolesAndBranches();
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      let emailValue = value;
      if (!emailValue.endsWith('@gmail.com')) {
        emailValue = emailValue.replace(/@.*/, '') + '@gmail.com';
      }
      setFormData(prev => ({ ...prev, [name]: emailValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddUser = async () => {
    if (formData.name.trim()) {
      try {
        await axios.post(`${backend_url}/users`, formData);
        resetForm();
        fetchUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to add user';
        alert('Add User Error: ' + msg);
      }
    } else {
      alert('Name is required');
    }
  };

  const handleUpdateUser = async () => {
    if (formData.name.trim() && currentUserId) {
      try {
        await axios.put(`${backend_url}/users/${currentUserId}`, formData);
        resetForm();
        fetchUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update user';
        alert('Update User Error: ' + msg);
      }
    } else {
      alert('Name is required');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      await axios.delete(`${backend_url}/users/${id}`);
      fetchUsers();
    }
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setCurrentUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email || '',
      password: '', // leave blank for edit
      role: user.role,
      branch: user.branch,
      departments: (user.departments || []).map(dep => (typeof dep === 'object' ? dep._id : dep)),
      loginPin: user.loginPin,
      biometricId: user.biometricId
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      branch: '',
      departments: [],
      loginPin: '',
      biometricId: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      branch: '',
      departments: [],
      loginPin: '',
      biometricId: ''
    });
    setShowModal(false);
    setEditMode(false);
    setCurrentUserId(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Users</h2>
        <button
          className="bg-[#735dff] text-white px-4 py-2 rounded"
          onClick={openAddModal}
        >
          Add User
        </button>
      </div>

      <table className="min-w-full bg-white border border-gray-200 text-center align-middle">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-center">Name</th>
            <th className="py-2 px-4 border-b text-center">Role</th>
            <th className="py-2 px-4 border-b text-center">Email</th>
            <th className="py-2 px-4 border-b text-center">Biometric</th>
            <th className="py-2 px-4 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="py-2 px-4 border-b text-center">{user.name}</td>
              <td className="py-2 px-4 border-b text-center">{user.role}</td>
              <td className="py-2 px-4 border-b text-center">{user.email}</td>
              <td className="py-2 px-4 border-b text-center">{user.biometricId}</td>
              <td className="py-2 px-4 border-b text-center">
                <span className="text-blue-600 cursor-pointer mr-2" onClick={() => openEditModal(user)}>Edit</span>
                <span className="text-red-600 cursor-pointer" onClick={() => handleDelete(user._id)}>Delete</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-1/2">
            <h3 className="text-lg font-semibold mb-4">
              {editMode ? 'Edit User' : 'Add New User'}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="border p-2 rounded"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="biometricId"
                value={formData.biometricId}
                onChange={handleChange}
                placeholder="Biometric ID"
                className="border p-2 rounded"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email (e.g. admin@gmail.com)"
                className="border p-2 rounded"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="border p-2 rounded"
              />
            </div>

            <div className="flex justify-end">
              <button className="mr-2 px-4 py-2 rounded border" onClick={resetForm}>Cancel</button>
              <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={editMode ? handleUpdateUser : handleAddUser}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
