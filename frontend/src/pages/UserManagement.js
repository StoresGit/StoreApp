import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';
import ResponsiveTable from '../components/ResponsiveTable';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backend_url}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-medium text-sm">
              {typeof user.name === 'string' && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.role === 'admin' 
            ? 'bg-green-100 text-green-800' 
            : user.role === 'manager'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {typeof user.role === 'string' && user.role.length > 0 ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (user) => (
        <div className="text-sm text-gray-900">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    }
  ];

  // Mobile card render function
  const mobileCardRender = (user, index) => (
    <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-medium text-lg">
              {typeof user.name === 'string' && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.role === 'admin' 
            ? 'bg-green-100 text-green-800' 
            : user.role === 'manager'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {typeof user.role === 'string' && user.role.length > 0 ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Joined</p>
          <p className="text-sm font-medium">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-6">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-medium">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage and view all system users</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <span className="font-semibold">
              Total Users: {users.length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <ResponsiveTable
          title="System Users"
          columns={columns}
          data={filteredUsers}
          loading={loading}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          mobileCardRender={mobileCardRender}
          showActions={false}
        />
      </div>
    </div>
  );
};

export default UserManagement; 