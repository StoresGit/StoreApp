import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const ORDER_STATUS_OPTIONS = [
  'Draft',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Rejected',
];

const CATEGORIES = [
  'Meat',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Beverages',
  'Other',
];

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs'];

function generateOrderNo() {
  const now = new Date();
  return `ORD-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
}

function generateItemCode(index) {
  return `ITM-${Date.now()}-${index+1}`;
}

const OrderSubmission = () => {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    status: 'Draft',
    orderNo: generateOrderNo(),
    section: '',
    userName: '',
    dateTime: new Date().toISOString().slice(0,16),
    scheduleDate: '',
    items: [
      { itemCode: generateItemCode(0), itemName: '', unit: '', category: '', orderQty: '' },
    ],
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await apiService.sections.getActive();
        setSections(response.data || []);
      } catch (error) {
        console.error('Error fetching sections:', error);
        setError('Failed to load sections');
      }
    };

    fetchSections();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'status') {
      setShowSchedule(value === 'Draft');
    }
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [name]: value } : item),
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { itemCode: generateItemCode(prev.items.length), itemName: '', unit: '', category: '', orderQty: '' },
      ],
    }));
  };

  const removeItem = (idx) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare order data for backend
      const orderData = {
        ...form,
        dateTime: new Date(form.dateTime),
        scheduleDate: form.scheduleDate ? new Date(form.scheduleDate) : null,
        items: form.items.map(item => ({
          ...item,
          orderQty: parseFloat(item.orderQty) || 0
        }))
      };

      // Send to backend
      await apiService.orders.create(orderData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      
      // Reset form
      setForm({
        status: 'Draft',
        orderNo: generateOrderNo(),
        section: '',
        userName: '',
        dateTime: new Date().toISOString().slice(0,16),
        scheduleDate: '',
        items: [
          { itemCode: generateItemCode(0), itemName: '', unit: '', category: '', orderQty: '' },
        ],
      });
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Order Submission</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Order submitted successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
                {ORDER_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order No</label>
              <input type="text" name="orderNo" value={form.orderNo} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Select Section</label>
              <select name="section" value={form.section} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="">Select...</option>
                {sections.map(section => (
                  <option key={section._id} value={section.name}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">User Name</label>
              <input type="text" name="userName" value={form.userName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" name="dateTime" value={form.dateTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            {showSchedule && (
              <div>
                <label className="block text-sm font-medium mb-1 text-yellow-700">Schedule Order Time & Date</label>
                <input type="datetime-local" name="scheduleDate" value={form.scheduleDate} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-yellow-50" />
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">Item Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Order Qty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={item.itemCode}>
                      <td className="px-3 py-2"><input type="text" value={item.itemCode} readOnly className="w-28 border rounded px-2 py-1 bg-gray-100" /></td>
                      <td className="px-3 py-2"><input type="text" name="itemName" value={item.itemName} onChange={e => handleItemChange(idx, e)} className="w-32 border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2">
                        <select name="unit" value={item.unit} onChange={e => handleItemChange(idx, e)} className="w-20 border rounded px-2 py-1">
                          <option value="">Select</option>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select name="category" value={item.category} onChange={e => handleItemChange(idx, e)} className="w-28 border rounded px-2 py-1">
                          <option value="">Select</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2"><input type="number" name="orderQty" value={item.orderQty} onChange={e => handleItemChange(idx, e)} className="w-20 border rounded px-2 py-1" min="1" /></td>
                      <td className="px-3 py-2">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:underline">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addItem} className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">+ Add Item</button>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderSubmission; 