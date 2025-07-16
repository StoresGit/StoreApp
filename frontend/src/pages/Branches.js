import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';
import ResponsiveTable from '../components/ResponsiveTable';
import { FormModal, ConfirmationModal } from '../components/ResponsiveModal';
import { FormField, FormInput } from '../components/ResponsiveForm';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({ name: '', code: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const [deleteBranchId, setDeleteBranchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backend_url}/branch`);
      setBranches(res.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBranch.name.trim() || !newBranch.code.trim()) {
      alert('Please enter both Name and Code.');
      return;
    }

    try {
      setFormLoading(true);
      
      if (editMode) {
        await axios.put(`${backend_url}/branch/${currentBranchId}`, newBranch);
      } else {
        await axios.post(`${backend_url}/branch`, newBranch);
      }
      
      setNewBranch({ name: '', code: '' });
      setCurrentBranchId(null);
      setEditMode(false);
      setShowModal(false);
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error saving branch. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteBranchId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${backend_url}/branch/${deleteBranchId}`);
      fetchBranches();
      setShowDeleteModal(false);
      setDeleteBranchId(null);
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Error deleting branch. Please try again.');
    }
  };

  const handleEdit = (branch) => {
    setEditMode(true);
    setCurrentBranchId(branch._id);
    setNewBranch({ name: branch.name, code: branch.code });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setNewBranch({ name: '', code: '' });
    setCurrentBranchId(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter branches based on search query
  const filteredBranches = branches.filter(branch => 
    branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Table columns configuration
  const columns = [
    {
      key: 'index',
      header: '#',
      render: (branch, index) => (
        <span className="text-gray-500 font-mono">{index + 1}</span>
      )
    },
    {
      key: 'name',
      header: 'Branch Name',
      sortable: true,
      render: (branch) => (
        <div className="font-medium text-gray-900">{branch.name}</div>
      )
    },
    {
      key: 'code',
      header: 'Branch Code',
      sortable: true,
      render: (branch) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-mono">
          {branch.code}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (branch) => (
        <div className="text-sm text-gray-500">
          {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    }
  ];

  // Mobile card render function
  const mobileCardRender = (branch, index) => (
    <div key={branch._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{branch.name}</h3>
          <p className="text-sm text-gray-500">#{index + 1}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-mono">
          {branch.code}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-gray-500">Created</p>
        <p className="text-sm font-medium">
          {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => handleEdit(branch)}
          className="text-green-600 hover:text-green-800 p-1 rounded"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(branch._id)}
          className="text-red-600 hover:text-red-800 p-1 rounded"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage your branch locations and codes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Branch
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">🏢</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-lg">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg. per Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(branches.length / 12) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Branches Table */}
      <ResponsiveTable
        title="Branch Management"
        columns={columns}
        data={filteredBranches}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        mobileCardRender={mobileCardRender}
      />

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        title={editMode ? 'Edit Branch' : 'Add New Branch'}
        submitText={editMode ? 'Update Branch' : 'Add Branch'}
        loading={formLoading}
      >
        <FormField label="Branch Name" required>
          <FormInput
            type="text"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            placeholder="Enter branch name"
            required
          />
        </FormField>

        <FormField label="Branch Code" required>
          <FormInput
            type="text"
            value={newBranch.code}
            onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
            placeholder="Enter branch code"
            required
          />
        </FormField>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? This action cannot be undone."
        type="danger"
      />
    </div>
  );
};

export default Branches;
