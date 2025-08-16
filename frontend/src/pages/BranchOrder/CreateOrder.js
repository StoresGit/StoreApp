import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import backend_url from '../../config/config';
import { MasterAdminOnly } from '../../components/PermissionGuard';
import { useAuth } from '../../context/AuthContext';

const ORDER_TYPES = ['Urgent', 'Routine', 'Schedule'];

const CreateOrder = () => {
  const { user } = useAuth();

  // Step-by-step selection state
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Order form state (for modal)
  const [orderType, setOrderType] = useState('Urgent');
  const [orderStatus, setOrderStatus] = useState('Draft');
  const [orderNo, setOrderNo] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [scheduleDate, setScheduleDate] = useState(null);
  const [items, setItems] = useState([
    { code: '', name: '', unit: '', category: '', subCategory: '', qty: '' }
  ]);

  // Data state
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const generateOrderNo = () => {
    const now = new Date();
    return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
  };

  // Fetch reference data
  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [sectionsRes, itemsRes, branchesRes] = await Promise.all([
          axios.get(`${backend_url}/sections/active`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/items`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/branch`, { headers }).catch(() => ({ data: [] })),
        ]);
        setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setAllBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      } catch (e) {
        console.error('Failed to load required data:', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Filter sections when branch is selected
  useEffect(() => {
    if (selectedBranch) {
      const branchSections = sections.filter(section => {
        const sectionBranch = section.branch;
        const sectionBranchId = section.branchId;
        const sectionBranches = section.branches;
        
        if (sectionBranch === selectedBranch._id) return true;
        if (sectionBranchId === selectedBranch._id) return true;
        if (Array.isArray(sectionBranches) && sectionBranches.includes(selectedBranch._id)) return true;
        if (sectionBranch && typeof sectionBranch === 'object' && sectionBranch._id === selectedBranch._id) return true;
        if (sectionBranchId && typeof sectionBranchId === 'object' && sectionBranchId._id === selectedBranch._id) return true;
        
        return false;
      });
      setFilteredSections(branchSections);
    } else {
      setFilteredSections([]);
    }
  }, [selectedBranch, sections]);

  // Generate order number when modal opens
  useEffect(() => {
    if (showOrderModal) {
      setOrderNo(generateOrderNo());
    }
  }, [showOrderModal]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setSelectedSection(null);
    setShowBranchDropdown(false);
    setShowSectionDropdown(true);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setShowSectionDropdown(false);
    setShowOrderModal(true);
  };

  const findItemByName = (name) => allItems.find(i => (i.nameEn || i.name) === name);

  const handleItemNameSelect = (idx, name) => {
    const chosen = findItemByName(name);
    setItems(prev => {
      const next = [...prev];
      if (chosen) {
        let unitName = '';
        if (chosen.unit && chosen.unit.name) {
          unitName = chosen.unit.name;
        } else if (chosen.baseUnit && chosen.baseUnit.name) {
          unitName = chosen.baseUnit.name;
        } else if (chosen.unit) {
          unitName = chosen.unit;
        } else if (chosen.baseUnit) {
          unitName = chosen.baseUnit;
        }

        let categoryName = '';
        if (chosen.category && chosen.category.nameEn) {
          categoryName = chosen.category.nameEn;
        } else if (chosen.category && chosen.category.name) {
          categoryName = chosen.category.name;
        } else if (chosen.subCategory && chosen.subCategory.nameEn) {
          categoryName = chosen.subCategory.nameEn;
        } else if (chosen.subCategory && chosen.subCategory.name) {
          categoryName = chosen.subCategory.name;
        }

        let subCategoryName = '';
        if (chosen.subCategory && chosen.subCategory.nameEn) {
          subCategoryName = chosen.subCategory.nameEn;
        } else if (chosen.subCategory && chosen.subCategory.name) {
          subCategoryName = chosen.subCategory.name;
        }

        next[idx] = {
          ...next[idx],
          name: chosen.nameEn || chosen.name || name,
          code: chosen.itemCode || chosen.item_code || '',
          unit: unitName,
          category: categoryName,
          subCategory: subCategoryName,
        };
      } else {
        next[idx] = { ...next[idx], name, code: '', unit: '', category: '', subCategory: '' };
      }
      return next;
    });
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addItemRow = () => setItems(prev => [...prev, { code: '', name: '', unit: '', category: '', subCategory: '', qty: '' }]);
  const removeItemRow = (idx) => setItems(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const isValid = useMemo(() => {
    if (!dateTime || !orderNo) return false;
    if (!selectedSection) return false;
    if (!selectedBranch) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    for (const it of items) {
      if (!it.name || !it.code || !it.unit || !it.category || !it.qty || Number(it.qty) <= 0) return false;
    }
    return true;
  }, [dateTime, orderNo, selectedSection, items, selectedBranch]);

  const doSubmit = async (finalStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        orderType,
        status: finalStatus,
        orderNo,
        section: selectedSection?.name || '',
        userName: user?.name || '',
        dateTime,
        scheduleDate: orderType === 'Schedule' ? scheduleDate : null,
        branches: [selectedBranch._id],
        items: items.map(it => ({
          itemCode: it.code,
          itemName: it.name,
          unit: it.unit,
          category: it.category,
          subCategory: it.subCategory,
          orderQty: Number(it.qty)
        }))
      };

      await axios.post(`${backend_url}/orders`, payload, { headers });
      setSubmitSuccess('Order saved successfully');
      setSubmitError('');
      resetForm();
    } catch (e) {
      setSubmitError(e.response?.data?.error || e.message || 'Failed to save order');
      setSubmitSuccess('');
    }
  };

  const resetForm = () => {
    setItems([{ code: '', name: '', unit: '', category: '', subCategory: '', qty: '' }]);
      setOrderType('Urgent');
      setOrderStatus('Draft');
      setDateTime(new Date());
      setScheduleDate(null);
    setShowOrderModal(false);
    setSelectedBranch(null);
    setSelectedSection(null);
    setShowSectionDropdown(false);
  };

  const onSaveDraft = (e) => {
    e.preventDefault();
    if (!isValid) { setSubmitError('Please complete all required fields before saving.'); return; }
    setPendingAction('draft');
    setOrderStatus('Draft');
    setShowConfirm(true);
  };

  const onSubmitForApproval = (e) => {
    e.preventDefault();
    if (!isValid) { setSubmitError('Please complete all required fields before submitting.'); return; }
    setPendingAction('submit');
    setOrderStatus('Under Review');
    setShowConfirm(true);
  };

  const confirmAction = async () => {
    const statusToSend = pendingAction === 'submit' ? 'Under Review' : 'Draft';
    setShowConfirm(false);
    await doSubmit(statusToSend);
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
    setPendingAction('');
    setOrderStatus('Draft');
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSubmitError('');
    setSubmitSuccess('');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Create Order</h1>

        {/* Step-by-step selection interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Branch Selection Box */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Select Branch</h2>
            <div className="relative">
              <button
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedBranch ? selectedBranch.name : 'Click to select branch'}
              </button>
              
              {showBranchDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {allBranches.map(branch => (
                    <button
                      key={branch._id}
                      onClick={() => handleBranchSelect(branch)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Selection Box */}
          {selectedBranch && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Select Section</h2>
              <div className="relative">
                <button
                  onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                  className="w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedSection ? selectedSection.name : 'Click to select section'}
                </button>
                
                {showSectionDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSections.map(section => (
                      <button
                        key={section._id}
                        onClick={() => handleSectionSelect(section)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filteredSections.length === 0 && (
                <p className="text-sm text-red-500 mt-2">No sections available for this branch</p>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!selectedBranch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Step 1:</strong> Click on the "Select Branch" box to choose a branch
            </p>
          </div>
        )}

        {selectedBranch && !selectedSection && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              <strong>Step 2:</strong> Click on the "Select Section" box to choose a section for {selectedBranch.name}
            </p>
          </div>
        )}

        {/* Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Order</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
            </div>

                <form className="space-y-6">
                  {/* Pre-filled Branch and Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <label className="block text-sm font-medium mb-1">Branch</label>
                      <input 
                        className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" 
                        value={selectedBranch?.name || ''} 
                        readOnly 
                      />
            </div>
            <div>
                      <label className="block text-sm font-medium mb-1">Section</label>
                      <input 
                        className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" 
                        value={selectedSection?.name || ''} 
                        readOnly 
                      />
            </div>
          </div>

                  {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <input className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" value={orderStatus} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Date & Time</label>
                      <DatePicker selected={dateTime} onChange={() => {}} showTimeSelect dateFormat="Pp" className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" readOnly />
                    </div>
            </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <label className="block text-sm font-medium mb-1">Order No</label>
                      <input className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" value={orderNo} readOnly />
            </div>
            <div>
                      <label className="block text-sm font-medium mb-1">Order Type</label>
                      <select className="w-full border rounded px-2 py-1" value={orderType} onChange={e => setOrderType(e.target.value)}>
                        {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
            </div>
          </div>

                  {/* Schedule (if applicable) */}
          {orderType === 'Schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-start-3">
                        <label className="block text-sm font-medium mb-1">Schedule Time & Date</label>
                        <DatePicker selected={scheduleDate} onChange={date => setScheduleDate(date)} showTimeSelect dateFormat="Pp" className="w-full border rounded px-2 py-1" placeholderText="Select schedule time" />
              </div>
            </div>
          )}

                  {/* Items */}
          <div>
            <label className="block text-lg font-semibold mb-2">Order Items</label>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Item Code</th>
                    <th className="border px-2 py-1">Item Name</th>
                            <th className="border px-2 py-1">Item Category</th>
                            <th className="border px-2 py-1">Sub Category</th>
                    <th className="border px-2 py-1">Unit</th>
                    <th className="border px-2 py-1">Order Qty</th>
                            <th className="border px-2 py-1">Created By</th>
                    <th className="border px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">
                                <input className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={item.code} readOnly />
                              </td>
                              <td className="border px-2 py-1">
                                <input list={`item-list-${idx}`} className="w-full border rounded px-1 py-0.5" value={item.name} onChange={e => handleItemNameSelect(idx, e.target.value)} placeholder="Search item..." />
                                <datalist id={`item-list-${idx}`}>
                                  {allItems.map(it => (
                                    <option key={it._id} value={it.nameEn || it.name} />
                                  ))}
                                </datalist>
                      </td>
                      <td className="border px-2 py-1">
                                <input type="text" className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={item.category} readOnly placeholder="Auto-filled" />
                      </td>
                      <td className="border px-2 py-1">
                                <input type="text" className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={item.subCategory} readOnly placeholder="Auto-filled" />
                      </td>
                      <td className="border px-2 py-1">
                                <input type="text" className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={item.unit} readOnly placeholder="Auto-filled" />
                      </td>
                      <td className="border px-2 py-1">
                        <input type="number" min="0" className="w-full border rounded px-1 py-0.5" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
                      </td>
                              <td className="border px-2 py-1">
                                <input className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={user?.name || ''} readOnly />
                              </td>
                      <td className="border px-2 py-1 text-center">
                        <button type="button" className="text-red-500 font-bold px-2" onClick={() => removeItemRow(idx)} disabled={items.length === 1}>-</button>
                        <button type="button" className="text-green-500 font-bold px-2" onClick={addItemRow}>+</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {submitError && <div className="text-red-600 mb-2">{submitError}</div>}
          {submitSuccess && <div className="text-green-600 mb-2">{submitSuccess}</div>}

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <button onClick={closeModal} className="bg-gray-500 text-white px-6 py-2 rounded font-semibold hover:bg-gray-600" type="button">Cancel</button>
                    <button onClick={onSaveDraft} className="bg-gray-500 text-white px-6 py-2 rounded font-semibold hover:bg-gray-600" type="button">Save As Draft</button>
                    <button onClick={onSubmitForApproval} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700" type="button">Submit Order For Approval</button>
          </div>
        </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6">
              <h3 className="text-xl font-semibold mb-4">Confirm Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Status:</span> {orderStatus}</div>
                <div><span className="font-medium">Date & Time:</span> {new Date(dateTime).toLocaleString()}</div>
                <div><span className="font-medium">Order No:</span> {orderNo}</div>
                <div><span className="font-medium">Order Type:</span> {orderType}</div>
                <div><span className="font-medium">Section:</span> {selectedSection?.name || ''}</div>
                <div><span className="font-medium">Branch:</span> {selectedBranch?.name || ''}</div>
              </div>
              <div className="mt-4">
                <table className="min-w-full border text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Item Code</th>
                      <th className="border px-2 py-1">Item Name</th>
                      <th className="border px-2 py-1">Category</th>
                      <th className="border px-2 py-1">Sub Category</th>
                      <th className="border px-2 py-1">Unit</th>
                      <th className="border px-2 py-1">Qty</th>
                      <th className="border px-2 py-1">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{it.code}</td>
                        <td className="border px-2 py-1">{it.name}</td>
                        <td className="border px-2 py-1">{it.category}</td>
                        <td className="border px-2 py-1">{it.subCategory}</td>
                        <td className="border px-2 py-1">{it.unit}</td>
                        <td className="border px-2 py-1">{it.qty}</td>
                        <td className="border px-2 py-1">{user?.name || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={cancelConfirm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={confirmAction} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Confirm</button>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <span className="font-semibold">Status Flow: </span>
                Draft → Under Review → Sent to CK → Shipped → Received (or Rejected)
              </div>
            </div>
          </div>
        )}
      </div>
    </MasterAdminOnly>
  );
};

export default CreateOrder; 