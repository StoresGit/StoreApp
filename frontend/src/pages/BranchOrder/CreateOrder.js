import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import backend_url from '../../config/config';

const ORDER_TYPES = ['Urgent', 'Routine', 'Schedule'];
const ORDER_STATUSES = ['Draft', 'Confirmed', 'Shipped', 'Delivered', 'Rejected'];
const SECTIONS = ['Section A', 'Section B', 'Section C']; // Example sections
const UNITS = ['Kg', 'Litre', 'Piece']; // Example units

const CreateOrder = () => {
  const [orderType, setOrderType] = useState('Urgent');
  const [orderStatus, setOrderStatus] = useState('Draft');
  const [orderNo] = useState('');
  const [section, setSection] = useState(SECTIONS[0]);
  const [userName, setUserName] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [scheduleDate, setScheduleDate] = useState(null);
  const [branchCategories, setBranchCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([
    { code: '', name: '', unit: UNITS[0], category: '', qty: '' },
  ]);

  // Fetch branch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backend_url}/branch-categories`);
        
        // Ensure data is array
        const branchData = Array.isArray(res.data) ? res.data : [];
        setBranchCategories(branchData);
      } catch (error) {
        console.error('Error fetching branch categories:', error);
        setError('Failed to load branch categories');
        setBranchCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Generate a unique item code
  const generateItemCode = (idx) => `ITEM${Date.now()}${idx}`;

  // Handle item row changes
  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { code: generateItemCode(items.length), name: '', unit: UNITS[0], category: '', qty: '' },
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit logic here
    alert('Order submitted! (Demo)');
  };

  // On mount, generate code for the first item
  React.useEffect(() => {
    setItems([{ ...items[0], code: generateItemCode(0) }]);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Create Order</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 border border-gray-200">
        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order Type</label>
            <select className="w-full border rounded px-2 py-1" value={orderType} onChange={e => setOrderType(e.target.value)}>
              {ORDER_TYPES.map(type => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Status</label>
            <select className="w-full border rounded px-2 py-1" value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
              {ORDER_STATUSES.map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order No</label>
            <input className="w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed" value={orderNo} readOnly tabIndex={-1} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Section</label>
            <select className="w-full border rounded px-2 py-1" value={section} onChange={e => setSection(e.target.value)}>
              {SECTIONS.map(sec => <option key={sec}>{sec}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User Name</label>
            <input className="w-full border rounded px-2 py-1" value={userName} onChange={e => setUserName(e.target.value)} placeholder="User Name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <DatePicker
              selected={dateTime}
              onChange={date => setDateTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        {/* Schedule Order Time & Date (only if Schedule) */}
        {orderType === 'Schedule' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-start-3">
              <label className="block text-sm font-medium mb-1 bg-yellow-200 px-2 py-1 rounded">Schedule Order Time & Date</label>
              <DatePicker
                selected={scheduleDate}
                onChange={date => setScheduleDate(date)}
                showTimeSelect
                dateFormat="Pp"
                className="w-full border rounded px-2 py-1"
                placeholderText="Select schedule time"
              />
            </div>
          </div>
        )}
        {/* Item Table */}
        <div>
          <label className="block text-lg font-semibold mb-2">Order Items</label>
          {loading && <p className="text-blue-600 mb-2">Loading categories...</p>}
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Item Code</th>
                  <th className="border px-2 py-1">Item Name</th>
                  <th className="border px-2 py-1">Unit</th>
                  <th className="border px-2 py-1">Category</th>
                  <th className="border px-2 py-1">Order Qty</th>
                  <th className="border px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1 py-0.5 bg-gray-100 cursor-not-allowed" value={item.code} readOnly tabIndex={-1} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1 py-0.5" value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <select className="w-full border rounded px-1 py-0.5" value={item.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <select className="w-full border rounded px-1 py-0.5" value={item.category} onChange={e => handleItemChange(idx, 'category', e.target.value)}>
                        <option value="">Select Category</option>
                        {branchCategories.map(cat => (
                          <option key={cat._id} value={cat.nameEn}>
                            {cat.nameEn}
                          </option>
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
        {/* Submit Button */}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700">Submit Order</button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder; 