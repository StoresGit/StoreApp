import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backend_url from '../config/config';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [images, setImages] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Supplier Information
    legalName: '',
    shortName: '',
    taxRegistrationNo: '',
    googleLocation: '',
    repName: '',
    mobileCall: '',
    mobileWhatsapp: '',
    image: '',
    assignBranch: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [supplierRes, branchRes, imgRes] = await Promise.all([
        axios.get(`${backend_url}/suppliers`).catch(() => ({ data: [] })),
        axios.get(`${backend_url}/branch`).catch(() => ({ data: [] })),
        axios.get(`${backend_url}/gallery`).catch(() => ({ data: [] }))
      ]);
      
      setSuppliers(supplierRes.data || []);
      setBranches(branchRes.data || []);
      setImages(imgRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.legalName?.trim()) {
        alert('Legal Name is required');
        return;
      }

      const submitData = { ...formData };

      if (editingId) {
        await axios.put(`${backend_url}/suppliers/${editingId}`, submitData);
        alert('Supplier updated successfully!');
      } else {
        await axios.post(`${backend_url}/suppliers`, submitData);
        alert('Supplier added successfully!');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      legalName: supplier.legalName || '',
      shortName: supplier.shortName || '',
      taxRegistrationNo: supplier.taxRegistrationNo || '',
      googleLocation: supplier.googleLocation || '',
      repName: supplier.repName || '',
      mobileCall: supplier.mobileCall || '',
      mobileWhatsapp: supplier.mobileWhatsapp || '',
      image: supplier.image?._id || '',
      assignBranch: supplier.assignBranch?._id || '',
    });
    
    setEditingId(supplier._id);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`${backend_url}/suppliers/${id}`);
        alert('Supplier deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      legalName: '',
      shortName: '',
      taxRegistrationNo: '',
      googleLocation: '',
      repName: '',
      mobileCall: '',
      mobileWhatsapp: '',
      image: '',
      assignBranch: '',
    });
    setEditingId(null);
    setShowFormModal(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#735dff] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchData}
            className="bg-[#735dff] text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Suppliers Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
          className="bg-[#735dff] text-white px-4 py-2 rounded"
        >
          Add Supplier
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Legal Name</th>
              <th className="p-2 border">Short Name</th>
              <th className="p-2 border">Rep. Name</th>
              <th className="p-2 border">Mobile Call</th>
              <th className="p-2 border">Branch</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier._id} className="text-center">
                <td className="p-2 border font-medium">{supplier.legalName || 'N/A'}</td>
                <td className="p-2 border">{supplier.shortName || 'N/A'}</td>
                <td className="p-2 border">{supplier.repName || 'N/A'}</td>
                <td className="p-2 border">{supplier.mobileCall || 'N/A'}</td>
                <td className="p-2 border">{supplier.assignBranch?.name || 'N/A'}</td>
                <td className="p-2 border">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Active
                  </span>
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => handleDelete(supplier._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No suppliers found. Add your first supplier to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Supplier */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? 'Edit Supplier' : 'Add Supplier'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>



            {/* Basic Supplier Information */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 text-[#735dff] border-b pb-2">Supplier Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  placeholder="Legal Name *"
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  placeholder="Short Name"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="taxRegistrationNo"
                  value={formData.taxRegistrationNo}
                  onChange={handleChange}
                  placeholder="Tax Registration No"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="googleLocation"
                  value={formData.googleLocation}
                  onChange={handleChange}
                  placeholder="Google Location"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="repName"
                  value={formData.repName}
                  onChange={handleChange}
                  placeholder="Representative Name"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="mobileCall"
                  value={formData.mobileCall}
                  onChange={handleChange}
                  placeholder="Mobile No - Call"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="mobileWhatsapp"
                  value={formData.mobileWhatsapp}
                  onChange={handleChange}
                  placeholder="Mobile No - WhatsApp"
                  className="border p-2 rounded"
                />
                <select
                  name="assignBranch"
                  value={formData.assignBranch}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>



            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-500 px-4 py-2 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#735dff] text-white px-4 py-2 rounded hover:bg-[#5a4bcc]"
              >
                {editingId ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Select Image</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {images.map(img => (
                <div
                  key={img._id}
                  className="cursor-pointer border rounded p-2 hover:bg-gray-50"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, image: img._id }));
                    setShowImageModal(false);
                  }}
                >
                  <img src={img.url} alt="img" className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
