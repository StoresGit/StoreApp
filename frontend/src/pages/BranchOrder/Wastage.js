import React, { useState, useEffect } from 'react';
// import { apiService } from '../../services/api';

const Wastage = () => {
  const [wastageRecords, setWastageRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWastage, setNewWastage] = useState({
    date: new Date().toISOString().split('T')[0],
    section: '',
    items: [],
    reason: '',
    notes: ''
  });
  // const [error, setError] = useState('');

  // Mock data for demonstration (in real app, fetch from backend)
  useEffect(() => {
    const mockItems = [
      { id: 1, name: 'Chicken Breast', category: 'Meat', unit: 'kg' },
      { id: 2, name: 'Rice', category: 'Grains', unit: 'kg' },
      { id: 3, name: 'Tomatoes', category: 'Vegetables', unit: 'kg' },
      { id: 4, name: 'Milk', category: 'Dairy', unit: 'liter' },
    ];

    const mockWastageRecords = [
      {
        id: 1,
        date: '2024-01-20',
        section: 'Main Kitchen',
        items: [
          { itemId: 1, name: 'Chicken Breast', quantity: 2, unit: 'kg', reason: 'Expired' },
          { itemId: 3, name: 'Tomatoes', quantity: 1, unit: 'kg', reason: 'Spoiled' },
        ],
        reason: 'Spoilage/Expiration',
        notes: 'Routine check, disposed of expired chicken and spoiled tomatoes.'
      },
      {
        id: 2,
        date: '2024-01-18',
        section: 'Main Kitchen',
        items: [
          { itemId: 4, name: 'Milk', quantity: 0.5, unit: 'liter', reason: 'Spillage' },
        ],
        reason: 'Accidental Damage',
        notes: 'Milk carton dropped during transfer.'
      }
    ];

    setItems(mockItems);
    setWastageRecords(mockWastageRecords);
    setLoading(false);
  }, []);

  const sections = ['Main Kitchen', 'Bakery', 'Pantry', 'Cold Storage', 'Freezer'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWastage(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...newWastage.items];
    updatedItems[index] = { ...updatedItems[index], [name]: value };
    setNewWastage(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    setNewWastage(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', name: '', quantity: '', unit: '', reason: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newWastage.items.filter((_, i) => i !== index);
    setNewWastage(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd send this to a backend API
    const newRecord = {
      id: wastageRecords.length + 1,
      ...newWastage,
      items: newWastage.items.map(item => {
        const selectedItem = items.find(i => i.id === parseInt(item.itemId));
        return {
          ...item,
          name: selectedItem ? selectedItem.name : item.name,
          unit: selectedItem ? selectedItem.unit : item.unit,
        };
      })
    };
    setWastageRecords(prev => [...prev, newRecord]);
    setNewWastage({
      date: new Date().toISOString().split('T')[0],
      section: '',
      items: [],
      reason: '',
      notes: ''
    });
    setShowCreateForm(false);
    alert('Wastage record added successfully!');
  };

  if (loading) {
    return <div className="p-4">Loading wastage records...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wastage Records</h1>
          <p className="text-gray-600">Report wastage with a reason by section or by item</p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showCreateForm ? 'Cancel' : 'Add New Wastage Record'}
          </button>
        </div>



        {/* Create Wastage Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">New Wastage Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newWastage.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    id="section"
                    name="section"
                    value={newWastage.section}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-2">Wasted Items</h3>
              {newWastage.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                  <div>
                    <label htmlFor={`item-${index}`} className="block text-sm font-medium text-gray-700">Item</label>
                    <select
                      id={`item-${index}`}
                      name="itemId"
                      value={item.itemId}
                      onChange={(e) => handleItemChange(index, e)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`unit-${index}`} className="block text-sm font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      id={`unit-${index}`}
                      name="unit"
                      value={items.find(i => i.id === parseInt(item.itemId))?.unit || item.unit}
                      readOnly
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor={`item-reason-${index}`} className="block text-sm font-medium text-gray-700">Reason</label>
                    <input
                      type="text"
                      id={`item-reason-${index}`}
                      name="reason"
                      value={item.reason}
                      onChange={(e) => handleItemChange(index, e)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 w-full"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
              >
                Add Item
              </button>

              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Overall Reason for Wastage</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={newWastage.reason}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Spoilage, Accidental Damage, Expired"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newWastage.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Any additional details about the wastage..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Submit Wastage Record
              </button>
            </form>
          </div>
        )}

        {/* Wastage Records Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Existing Wastage Records</h2>
          {wastageRecords.length === 0 ? (
            <p>No wastage records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Reason</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Wasted</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wastageRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.items.map((item, idx) => (
                          <div key={idx}>{item.name} ({item.quantity} {item.unit}) - {item.reason}</div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wastage; 