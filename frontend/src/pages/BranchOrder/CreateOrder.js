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

  // Top-level order fields
  const [orderType, setOrderType] = useState('Urgent');
  const [orderStatus, setOrderStatus] = useState('Draft');
  const [orderNo, setOrderNo] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [scheduleDate, setScheduleDate] = useState(null);

  // Sections
  const [sections, setSections] = useState([]);
  const allowedSections = useMemo(() => {
    const userSectionIds = Array.isArray(user?.sections) ? user.sections : [];
    if (userSectionIds.length === 0) return sections;
    const ids = new Set(userSectionIds.map(s => (typeof s === 'string' ? s : s?._id)));
    return sections.filter(s => ids.has(s._id));
  }, [sections, user]);
  const [sectionId, setSectionId] = useState('');

  // Branches (multi-select)
  const [allBranches, setAllBranches] = useState([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);

  // Items / refs
  const [allItems, setAllItems] = useState([]);
  const [branchCategories, setBranchCategories] = useState([]);
  const [branchUnits, setBranchUnits] = useState([]);
  const [items, setItems] = useState([
    { code: '', name: '', unit: '', category: '', qty: '' }
  ]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        const [sectionsRes, catRes, itemsRes, unitsRes, branchesRes] = await Promise.all([
          axios.get(`${backend_url}/sections/active`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/branch-categories`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/items`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/units/branch`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/branch`, { headers }).catch(() => ({ data: [] })),
        ]);
        setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setBranchCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setBranchUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setAllBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      } catch (e) {
        setError('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    setOrderNo(generateOrderNo());
  }, []);

  const findItemByName = (name) => allItems.find(i => (i.nameEn || i.name) === name);

  const handleItemNameSelect = (idx, name) => {
    const chosen = findItemByName(name);
    setItems(prev => {
      const next = [...prev];
      if (chosen) {
        const autoUnitName = chosen.unit?.name || chosen.baseUnit?.name || chosen.unit || '';
        const allowedUnitNames = new Set(branchUnits.map(u => u.name));
        const autoCategoryName = chosen.category?.nameEn || chosen.category?.name || '';
        const allowedCategoryNames = new Set(branchCategories.map(c => c.nameEn));
        next[idx] = {
          ...next[idx],
          name: chosen.nameEn || chosen.name || name,
          code: chosen.itemCode || chosen.item_code || '',
          unit: allowedUnitNames.has(autoUnitName) ? autoUnitName : '',
          category: allowedCategoryNames.has(autoCategoryName) ? autoCategoryName : '',
        };
      } else {
        next[idx] = { ...next[idx], name, code: '', unit: '', category: '' };
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

  const toggleBranch = (id) => {
    setSelectedBranchIds(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const addItemRow = () => setItems(prev => [...prev, { code: '', name: '', unit: '', category: '', qty: '' }]);
  const removeItemRow = (idx) => setItems(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const isValid = useMemo(() => {
    if (!dateTime || !orderNo) return false;
    if (!sectionId) return false;
    if (selectedBranchIds.length === 0) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    for (const it of items) {
      if (!it.name || !it.code || !it.unit || !it.category || !it.qty || Number(it.qty) <= 0) return false;
    }
    return true;
  }, [dateTime, orderNo, sectionId, items, selectedBranchIds]);

  const doSubmit = async (finalStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const selectedSection = sections.find(s => s._id === sectionId);

      const payload = {
        orderType,
        status: finalStatus,
        orderNo,
        section: selectedSection?.name || '',
        userName: user?.name || '',
        dateTime,
        scheduleDate: orderType === 'Schedule' ? scheduleDate : null,
        branches: selectedBranchIds, // new field
        items: items.map(it => ({
          itemCode: it.code,
          itemName: it.name,
          unit: it.unit,
          category: it.category,
          orderQty: Number(it.qty)
        }))
      };

      await axios.post(`${backend_url}/orders`, payload, { headers });
      setSubmitSuccess('Order saved successfully');
      setSubmitError('');
      setItems([{ code: '', name: '', unit: '', category: '', qty: '' }]);
      setSectionId('');
      setOrderType('Urgent');
      setOrderStatus('Draft');
      setDateTime(new Date());
      setScheduleDate(null);
      setSelectedBranchIds([]);
      setOrderNo(generateOrderNo());
    } catch (e) {
      setSubmitError(e.response?.data?.error || e.message || 'Failed to save order');
      setSubmitSuccess('');
    }
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

  return (
    <MasterAdminOnly fallback={<div className="text-red-600 font-bold p-8">Access denied. Master admin only.</div>}>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Create Order</h1>

        <form className="bg-white rounded-lg shadow p-6 space-y-6 border border-gray-200">
          {/* Row 1: Status / Date & Time */}
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

          {/* Row 2: User / Order No / Order Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <input className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" value={user?.name || ''} readOnly />
            </div>
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

          {/* Row 3: Branches / Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Branches</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {allBranches.map(b => (
                  <label key={b._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedBranchIds.includes(b._id)} onChange={() => toggleBranch(b._id)} />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select className="w-full border rounded px-2 py-1" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">Select Section</option>
                {allowedSections.map(sec => (
                  <option key={sec._id} value={sec._id}>{sec.name}</option>
                ))}
              </select>
            </div>
            </div>

          {/* Row 4: Schedule (if applicable) */}
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
            {loading && <p className="text-blue-600 mb-2">Loading data...</p>}
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Item Code</th>
                    <th className="border px-2 py-1">Item Name</th>
                    <th className="border px-2 py-1">Item Category</th>
                    <th className="border px-2 py-1">Unit</th>
                    <th className="border px-2 py-1">Order Qty</th>
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
                        <select className="w-full border rounded px-1 py-0.5" value={item.category} onChange={e => handleItemChange(idx, 'category', e.target.value)}>
                          <option value="">Select Category</option>
                          {branchCategories.map(cat => (
                            <option key={cat._id} value={cat.nameEn}>{cat.nameEn}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <select className="w-full border rounded px-1 py-0.5" value={item.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                          <option value="">Select Unit</option>
                          {branchUnits.map(u => (
                            <option key={u._id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <input type="number" min="0" className="w-full border rounded px-1 py-0.5" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
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
            <button onClick={onSaveDraft} className="bg-gray-500 text-white px-6 py-2 rounded font-semibold hover:bg-gray-600" type="button">Save As Draft</button>
            <button onClick={onSubmitForApproval} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700" type="button">Submit Order For Approval</button>
          </div>
        </form>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
              <h3 className="text-xl font-semibold mb-4">Confirm Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Status:</span> {orderStatus}</div>
                <div><span className="font-medium">Date & Time:</span> {new Date(dateTime).toLocaleString()}</div>
                <div><span className="font-medium">User:</span> {user?.name || ''}</div>
                <div><span className="font-medium">Order No:</span> {orderNo}</div>
                <div><span className="font-medium">Order Type:</span> {orderType}</div>
                <div className="md:col-span-2"><span className="font-medium">Section:</span> {sections.find(s => s._id === sectionId)?.name || ''}</div>
                <div className="md:col-span-2"><span className="font-medium">Branches:</span> {allBranches.filter(b => selectedBranchIds.includes(b._id)).map(b => b.name).join(', ') || '-'}</div>
              </div>
              <div className="mt-4">
                <table className="min-w-full border text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Item Code</th>
                      <th className="border px-2 py-1">Item Name</th>
                      <th className="border px-2 py-1">Category</th>
                      <th className="border px-2 py-1">Unit</th>
                      <th className="border px-2 py-1">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{it.code}</td>
                        <td className="border px-2 py-1">{it.name}</td>
                        <td className="border px-2 py-1">{it.category}</td>
                        <td className="border px-2 py-1">{it.unit}</td>
                        <td className="border px-2 py-1">{it.qty}</td>
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