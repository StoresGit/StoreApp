import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import axios from 'axios';
import backend_url from '../../config/config';

const ORDER_TYPES = ['Urgent', 'Regular', 'Schedule'];

const OrderSubmission = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Individual loading states for each order
  const [processingOrders, setProcessingOrders] = useState(new Set());

  // Create Order form state for edit modal
  const [allBranches, setAllBranches] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [orderType, setOrderType] = useState('Urgent');
  const [scheduleDate, setScheduleDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch reference data and orders
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const ordersRes = await apiService.orders.getAll();
        const relevantOrders = Array.isArray(ordersRes?.data)
          ? ordersRes.data.filter(o => o.status === 'Draft' || o.status === 'Under Review')
          : [];
        setOrders(relevantOrders);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch form data for edit modal
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [itemsRes, branchesRes, sectionsRes] = await Promise.all([
          axios.get(`${backend_url}/items`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/branch`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${backend_url}/sections`, { headers }).catch(() => ({ data: [] })),
        ]);
        
        setAllItems(Array.isArray(itemsRes.data) ? itemsRes.data.filter(item => item && item._id) : []);
        setAllBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        setAllSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
      } catch (e) {
        console.error('Failed to load form data:', e);
      }
    };
    fetchFormData();
  }, []);



  // Filter items for edit modal
  useEffect(() => {
    if (editModalOpen && allItems.length > 0) {
      console.log('=== FILTERING ITEMS FOR EDIT MODAL ===');
      console.log('All items available:', allItems.length);
      console.log('Search term:', searchTerm);
      console.log('Section filter:', selectedSectionFilter);
      
      let filtered = allItems.filter(item => {
        if (!item || !item._id) return false;
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const itemName = (item.nameEn || item.name || '').toLowerCase();
          const itemCode = (item.itemCode || item.code || '').toLowerCase();
          if (!itemName.includes(searchLower) && !itemCode.includes(searchLower)) {
            return false;
          }
        }
        
        // Apply section filter if specified
        if (selectedSectionFilter.length > 0) {
          const itemSectionId = item.assignSection?._id;
          if (!itemSectionId || !selectedSectionFilter.includes(itemSectionId)) {
            return false;
          }
        }
        
        return true;
      });
      
      setFilteredItems(filtered);
      console.log('Filtered items for edit modal:', filtered.length, 'items');
    }
  }, [editModalOpen, allItems, searchTerm, selectedSectionFilter]);

  // Initialize form data when edit modal opens
  useEffect(() => {
    if (editingOrder && editModalOpen) {
      console.log('=== INITIALIZING FORM DATA ===');
      console.log('Editing order:', editingOrder);
      console.log('Editing order items:', editingOrder.items);
      
      setOrderType(editingOrder.orderType || 'Urgent');
      setScheduleDate(editingOrder.scheduleDate || '');
      setDeliveryDate(editingOrder.deliveryDate || new Date().toISOString().split('T')[0]);
      
      // Convert items array to selectedItems object
      const itemsObj = {};
      if (Array.isArray(editingOrder.items)) {
        console.log('Processing editingOrder items array...');
        editingOrder.items.forEach((item, index) => {
          console.log(`Processing editingOrder item ${index}:`, item);
          
          // Handle different item structures
          const itemId = item.itemId || item._id || item.id;
          const itemName = item.itemName || item.name || item.nameEn;
          const itemCode = item.itemCode || item.code;
          const qty = item.qty || item.quantity || 0;
          const unit = item.unit || item.unitName;
          const subCategory = item.subCategory || item.subCategoryId || '';
          
          console.log(`EditingOrder item ${index} processed:`, {
            itemId,
            itemName,
            itemCode,
            qty,
            unit,
            subCategory
          });
          
          if (itemId) {
            itemsObj[itemId] = {
              itemId: itemId,
              itemName: itemName,
              itemCode: itemCode,
              unit: unit,
              qty: qty,
              subCategory: subCategory
            };
          } else {
            console.warn(`EditingOrder item ${index} has no valid ID:`, item);
          }
        });
      } else {
        console.warn('EditingOrder items is not an array:', editingOrder.items);
      }
      
      console.log('Form data initialized with items:', itemsObj);
      console.log('Form data items keys:', Object.keys(itemsObj));
      setSelectedItems(itemsObj);
      
      console.log('=== FORM DATA INITIALIZATION COMPLETE ===');
    }
  }, [editingOrder, editModalOpen]);

  // Re-initialize form data when branches and sections are loaded
  useEffect(() => {
    if (editingOrder && editModalOpen && allBranches.length > 0 && allSections.length > 0) {
      console.log('=== RE-INITIALIZING FORM DATA ===');
      console.log('Current editing order:', editingOrder);
      console.log('Available branches:', allBranches.length);
      console.log('Available sections:', allSections.length);
      
      // Find the matching branch object with more comprehensive matching
      let selectedBranch = null;
      if (editingOrder.selectedBranch) {
        if (typeof editingOrder.selectedBranch === 'string') {
          selectedBranch = allBranches.find(b => 
            b._id === editingOrder.selectedBranch || 
            b.name === editingOrder.selectedBranch ||
            b.nameEn === editingOrder.selectedBranch
          );
        } else {
          selectedBranch = allBranches.find(b => 
            b._id === editingOrder.selectedBranch._id || 
            b.name === editingOrder.selectedBranch.name ||
            b.nameEn === editingOrder.selectedBranch.nameEn
          );
        }
      }
      
      // Find the matching section object with more comprehensive matching
      let selectedSection = null;
      if (editingOrder.selectedSection) {
        if (typeof editingOrder.selectedSection === 'string') {
          selectedSection = allSections.find(s => 
            s._id === editingOrder.selectedSection || 
            s.name === editingOrder.selectedSection ||
            s.nameEn === editingOrder.selectedSection
          );
        } else {
          selectedSection = allSections.find(s => 
            s._id === editingOrder.selectedSection._id || 
            s.name === editingOrder.selectedSection.name ||
            s.nameEn === editingOrder.selectedSection.nameEn
          );
        }
      }
      
      console.log('Re-found branch:', selectedBranch);
      console.log('Re-found section:', selectedSection);
      
      // Update the editing order with the found objects
      const updatedEditingOrder = {
        ...editingOrder,
        selectedBranch: selectedBranch,
        selectedSection: selectedSection
      };
      
      console.log('Updated editing order:', updatedEditingOrder);
      setEditingOrder(updatedEditingOrder);
      
      // If we have both branch and section, trigger item filtering
      if (selectedBranch && selectedSection) {
        console.log('Triggering item filtering with branch and section');
      }
      
      console.log('=== RE-INITIALIZATION COMPLETE ===');
    }
  }, [editingOrder, editModalOpen, allBranches, allSections]);

  // Auto-select existing items when filtered items are loaded
  useEffect(() => {
    if (editModalOpen && editingOrder && filteredItems.length > 0 && editingOrder.items) {
      console.log('=== AUTO-SELECTING EXISTING ITEMS ===');
      console.log('Filtered items:', filteredItems.length);
      console.log('Editing order items:', editingOrder.items);
      console.log('Current selectedItems:', Object.keys(selectedItems).length);
      
      const newSelectedItems = { ...selectedItems };
      let itemsSelected = 0;
      
      filteredItems.forEach(item => {
        if (!item || !item._id) return;
        
        // Check if this item was in the original order
        const existingItem = Array.isArray(editingOrder.items) ? 
          editingOrder.items.find(i => {
            // Try multiple matching strategies
            if (i.itemId === item._id) return true;
            if (i._id === item._id) return true;
            if (i.id === item._id) return true;
            if (i.itemCode === item.itemCode) return true;
            if (i.code === item.itemCode) return true;
            if (i.itemName === (item.nameEn || item.name)) return true;
            if (i.name === (item.nameEn || item.name)) return true;
            if (i.nameEn === (item.nameEn || item.name)) return true;
            return false;
          }) : null;
        
        if (existingItem && !newSelectedItems[item._id]) {
          console.log(`Auto-selecting item: ${item.itemCode} with quantity: ${existingItem.qty || existingItem.quantity || 1}`);
          const existingQty = existingItem.qty || existingItem.quantity || 1;
          newSelectedItems[item._id] = {
            itemId: item._id,
            itemName: item.nameEn || item.name,
            itemCode: item.itemCode,
            unit: item.unit?.name || item.baseUnit?.name,
            qty: existingQty,
            subCategory: item.subCategory?._id || ''
          };
          itemsSelected++;
        }
      });
      
      if (itemsSelected > 0) {
        console.log(`Auto-selected ${itemsSelected} items`);
        setSelectedItems(newSelectedItems);
      }
    }
  }, [editModalOpen, editingOrder, editingOrder?.items, filteredItems, selectedItems]);

  const openModal = (order) => {
    setActiveOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveOrder(null);
  };

  const openEditModal = (order) => {
    console.log('=== OPENING EDIT MODAL ===');
    console.log('Full order object:', order);
    console.log('Order branch data:', {
      branch: order.branch,
      branchName: order.branchName,
      branches: order.branches,
      section: order.section,
      assignSection: order.assignSection
    });
    console.log('Order items:', order.items);
    console.log('Order items type:', typeof order.items);
    console.log('Order items length:', Array.isArray(order.items) ? order.items.length : 'Not an array');
    console.log('Available branches:', allBranches.length);
    console.log('Available sections:', allSections.length);
    
    if (Array.isArray(order.items)) {
      order.items.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
      });
    }
    
    // Find the matching branch object with improved logic
    let selectedBranch = null;
    if (order.branch) {
      selectedBranch = allBranches.find(b => 
        b._id === order.branch || 
        b.name === order.branch || 
        b.nameEn === order.branch
      );
    } else if (order.branchName) {
      selectedBranch = allBranches.find(b => 
        b.name === order.branchName || 
        b.nameEn === order.branchName
      );
    } else if (order.branches && order.branches.length > 0) {
      selectedBranch = allBranches.find(b => 
        b._id === order.branches[0] || 
        b.name === order.branches[0] ||
        b.nameEn === order.branches[0]
      );
    }
    
    // Find the matching section object with improved logic
    let selectedSection = null;
    if (order.section) {
      selectedSection = allSections.find(s => 
        s._id === order.section || 
        s.name === order.section ||
        s.nameEn === order.section
      );
    } else if (order.assignSection) {
      selectedSection = allSections.find(s => 
        s._id === order.assignSection || 
        s.name === order.assignSection ||
        s.nameEn === order.assignSection
      );
    }
    
    console.log('Found branch:', selectedBranch);
    console.log('Found section:', selectedSection);
    
    // Set the editing order data for the modal
    const editingOrderData = {
      _id: order._id,
      orderNo: order.orderNo,
      orderType: order.orderType || 'Regular',
      selectedBranch: selectedBranch,
      selectedSection: selectedSection,
      deliveryDate: order.deliveryDate,
      scheduleDate: order.scheduleDate,
      items: order.items || [],
      status: order.status,
      dateTime: order.dateTime || order.createdAt,
      // Keep original data as fallback
      branch: order.branch,
      branchName: order.branchName,
      section: order.section,
      assignSection: order.assignSection
    };
    
    console.log('Setting editing order data:', editingOrderData);
    setEditingOrder(editingOrderData);
    
    // Initialize form data
    setOrderType(order.orderType || 'Urgent');
    setScheduleDate(order.scheduleDate || '');
    setDeliveryDate(order.deliveryDate || new Date().toISOString().split('T')[0]);
    
    // Initialize selectedItems with existing order items
    const itemsObj = {};
    if (Array.isArray(order.items)) {
      console.log('Processing order items array...');
      order.items.forEach((item, index) => {
        console.log(`Processing item ${index}:`, item);
        
        // Handle different item structures
        const itemId = item.itemId || item._id || item.id;
        const itemName = item.itemName || item.name || item.nameEn;
        const itemCode = item.itemCode || item.code;
        const qty = item.qty || item.quantity || 0;
        const unit = item.unit || item.unitName;
        const subCategory = item.subCategory || item.subCategoryId || '';
        
        console.log(`Item ${index} processed:`, {
          itemId,
          itemName,
          itemCode,
          qty,
          unit,
          subCategory
        });
        
        if (itemId) {
          itemsObj[itemId] = {
            itemId: itemId,
            itemName: itemName,
            itemCode: itemCode,
            unit: unit,
            qty: qty,
            subCategory: subCategory
          };
        } else {
          console.warn(`Item ${index} has no valid ID:`, item);
        }
      });
    } else {
      console.warn('Order items is not an array:', order.items);
    }
    
    console.log('Final selectedItems object:', itemsObj);
    console.log('SelectedItems keys:', Object.keys(itemsObj));
    setSelectedItems(itemsObj);
    
    // Clear search and filters to show all items initially
    setSearchTerm('');
    setSelectedSectionFilter([]);
    
    console.log('=== EDIT MODAL SETUP COMPLETE ===');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingOrder(null);
  };



  const handleSaveEdit = async () => {
    if (!editingOrder?._id) return;
    
    try {
      setEditSaving(true);
      
      // Convert selectedItems to order items format
      const orderItems = Object.values(selectedItems).map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        qty: item.qty,
        subCategory: item.subCategory
      }));
      
      // Prepare the updated order data
      const updatedOrder = {
        ...editingOrder,
        orderType: orderType,
        deliveryDate: deliveryDate,
        scheduleDate: orderType === 'Schedule' ? scheduleDate : undefined,
        items: orderItems
      };
      
      await apiService.orders.update(editingOrder._id, updatedOrder);
      
      // Update the order in the local state
      setOrders(prev => prev.map(o => o._id === editingOrder._id ? updatedOrder : o));
      
      // Close the modal
      closeEditModal();
      
      alert('Order updated successfully!');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to update order');
    } finally {
      setEditSaving(false);
    }
  };





  const sendToCK = async (order = null) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder?._id) return;
    
    console.log('=== SENDING ORDER TO CENTRAL KITCHEN ===');
    console.log('Target order:', targetOrder);
    console.log('Order ID:', targetOrder._id);
    console.log('Current status:', targetOrder.status);
    
    // Set individual loading state for this order
    setProcessingOrders(prev => new Set(prev).add(targetOrder._id));
    
    try {
      // Update status to "Sent to Central Kitchen" so it appears in order history and tracking
      const payload = { ...targetOrder, status: 'Sent to Central Kitchen' };
      console.log('Sending payload:', payload);
      
      const response = await apiService.orders.update(targetOrder._id, payload);
      console.log('Update response:', response);
      
      // Remove from current view since it's no longer Under Review
      setOrders(prev => prev.filter(o => o._id !== targetOrder._id));
      if (!order) {
        closeModal(); // Only close modal if called from modal
      }
      
      console.log('Order successfully sent to Central Kitchen');
    } catch (e) {
      console.error('Error sending to Central Kitchen:', e);
      setError(e.response?.data?.error || e.message || 'Failed to send to Central Kitchen');
    } finally {
      // Clear individual loading state for this order
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetOrder._id);
        return newSet;
      });
    }
  };

  const changeToUnderReview = async (order) => {
    if (!order?._id) return;
    
    // Set individual loading state for this order
    setProcessingOrders(prev => new Set(prev).add(order._id));
    
    try {
      const payload = { ...order, status: 'Under Review' };
      await apiService.orders.update(order._id, payload);
      // Update the order in the local state
      setOrders(prev => prev.map(o => o._id === order._id ? payload : o));
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to change status to Under Review');
    } finally {
      // Clear individual loading state for this order
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order._id);
        return newSet;
      });
    }
  };

  const renderItemsSummary = (order) => {
    const names = Array.isArray(order.items) ? order.items.map(i => i.itemName).filter(Boolean) : [];
    const preview = names.slice(0, 2).join(', ');
    const more = names.length > 2 ? ` +${names.length - 2} more` : '';
    return `${names.length} item${names.length !== 1 ? 's' : ''}${names.length ? ` (${preview}${more})` : ''}`;
  };

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Order Submission</h1>
        <p className="text-gray-600 mb-6">Orders submitted for approval appear here. You can review and edit item details, then send the order to Central Kitchen.</p>
            
        {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
        )}

        {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
        ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No orders in Under Review.</p>
        </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Order No</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Section</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Delivery Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                <tr key={order._id} className="border-b border-gray-200">
                    <td className="px-3 py-2">{order.orderNo}</td>
                    <td className="px-3 py-2">{order.userName}</td>
                    <td className="px-3 py-2">{order.section}</td>
                    <td className="px-3 py-2">{renderItemsSummary(order)}</td>
                    <td className="px-3 py-2">{new Date(order.createdAt || order.dateTime).toLocaleString()}</td>
                  <td className="px-3 py-2">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 
                      order.status === 'Under Review' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                    <td className="px-3 py-2 text-right">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(order)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        View
                      </button>
                      {order.status === 'Under Review' && (
                        <button
                          onClick={() => openEditModal(order)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                        >
                          Edit
                        </button>
                      )}
                      {order.status === 'Draft' && (
                        <button
                          onClick={() => changeToUnderReview(order)}
                          disabled={processingOrders.has(order._id)}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 text-sm"
                        >
                          {processingOrders.has(order._id) ? 'Processing...' : 'Send to Review'}
                        </button>
                      )}
                      {order.status === 'Under Review' && (
                        <button
                          onClick={() => sendToCK(order)}
                          disabled={processingOrders.has(order._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                        >
                          {processingOrders.has(order._id) ? 'Sending...' : 'Send to Central Kitchen'}
                        </button>
                      )}
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <>
          {/* View Modal */}
          {modalOpen && activeOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold">Order #{activeOrder.orderNo}</h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div><span className="font-medium">Status:</span> {activeOrder.status}</div>
                  <div><span className="font-medium">Date & Time:</span> {new Date(activeOrder.dateTime).toLocaleString()}</div>
                  <div><span className="font-medium">User:</span> {activeOrder.userName}</div>
                  <div><span className="font-medium">Order Type:</span> {activeOrder.orderType || activeOrder.type || '-'}</div>
                  <div><span className="font-medium">Branch:</span> {activeOrder.branchName || activeOrder.branch || activeOrder.branchNameEn || activeOrder.branchNameAr || '-'}</div>
                  <div><span className="font-medium">Section:</span> {activeOrder.section}</div>
              </div>

                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-2 py-1">Item Code</th>
                        <th className="border px-2 py-1">Item Name</th>
                        <th className="border px-2 py-1">Item Category</th>
                        <th className="border px-2 py-1">Unit</th>
                        <th className="border px-2 py-1">Order Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items.map((it, idx) => (
                        <tr key={`${it.itemCode}-${idx}`}>
                          <td className="border px-2 py-1">
                            <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.itemCode} readOnly />
                          </td>
                          <td className="border px-2 py-1">
                            <input className="w-40 border rounded px-1 py-0.5 bg-gray-100" value={it.itemName} readOnly />
                          </td>
                          <td className="border px-2 py-1">
                            <input className="w-36 border rounded px-1 py-0.5 bg-gray-100" value={it.category} readOnly />
                          </td>
                          <td className="border px-2 py-1">
                            <input className="w-28 border rounded px-1 py-0.5 bg-gray-100" value={it.unit} readOnly />
                          </td>
                          <td className="border px-2 py-1">
                            <input type="number" className="w-20 border rounded px-1 py-0.5 bg-gray-100" value={it.orderQty} readOnly />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button 
                    onClick={() => sendToCK()} 
                    disabled={processingOrders.has(activeOrder._id)} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {processingOrders.has(activeOrder._id) ? 'Sending...' : 'Submit Order'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editModalOpen && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden relative">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-gray-200 rounded-t-xl relative z-20">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Edit Order
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {editingOrder.selectedBranch?.name} {editingOrder.selectedSection ? `- ${editingOrder.selectedSection?.name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="text-white hover:text-blue-200 text-2xl font-bold transition-colors duration-200"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Main Content - Two Panel Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Filters and Categories */}
                <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                  <div className="space-y-6">
                    {/* Order Details */}
                    <div className="modern-card p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Order Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order No:</span>
                          <span className="font-medium">{editingOrder.orderNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Branch:</span>
                          <span className="font-medium">
                            {editingOrder.selectedBranch?.name || 
                             editingOrder.selectedBranch?.nameEn || 
                             editingOrder.branch || 
                             editingOrder.branchName || 
                             'Not selected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">{editingOrder.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <select 
                            className="border rounded px-2 py-1 text-sm" 
                            value={orderType} 
                            onChange={e => setOrderType(e.target.value)}
                          >
                            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {orderType === 'Schedule' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Schedule Date:</span>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{new Date(editingOrder.dateTime || new Date()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Date:</span>
                          <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Items
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by item name or code..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Section Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Section
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedSectionFilter.length === 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSectionFilter([]); // Select all (empty array means all sections)
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">All Sections</span>
                          </label>
                          {allSections.map(section => (
                            <label key={section._id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedSectionFilter.includes(section._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSectionFilter(prev => [...prev, section._id]);
                                  } else {
                                    setSelectedSectionFilter(prev => prev.filter(id => id !== section._id));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{section.nameEn || section.name || 'Unknown Section'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {selectedSectionFilter.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Selected: {selectedSectionFilter.length} section{selectedSectionFilter.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Select All Button */}
                    <div>
                      <button
                        onClick={() => {
                          const newSelectedItems = {};
                          filteredItems.forEach(item => {
                            if (item && item._id) {
                              const existingItem = Array.isArray(editingOrder.items) ? 
                                editingOrder.items.find(i => i.itemId === item._id) : null;
                              newSelectedItems[item._id] = {
                                itemId: item._id,
                                itemName: item.nameEn || item.name,
                                itemCode: item.itemCode,
                                unit: item.unit?.name || item.baseUnit?.name,
                                qty: existingItem ? existingItem.qty : 0,
                                subCategory: item.subCategory?._id || ''
                              };
                            }
                          });
                          setSelectedItems(newSelectedItems);
                        }}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        type="button"
                      >
                        Select All Items
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Items Table */}
                <div className="w-2/3 p-6 overflow-y-auto">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-semibold text-white">
                        Available Items ({filteredItems.length})
                      </h3>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              <input 
                                type="checkbox" 
                                checked={filteredItems.length > 0 && filteredItems.every(item => selectedItems[item._id])}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newSelectedItems = {};
                                    filteredItems.forEach(item => {
                                      if (item && item._id) {
                                        const existingItem = Array.isArray(editingOrder.items) ? 
                                          editingOrder.items.find(i => i.itemId === item._id) : null;
                                        newSelectedItems[item._id] = {
                                          itemId: item._id,
                                          itemName: item.nameEn || item.name,
                                          itemCode: item.itemCode,
                                          unit: item.unit?.name || item.baseUnit?.name,
                                          qty: existingItem ? existingItem.qty : 0,
                                          subCategory: item.subCategory?._id || ''
                                        };
                                      }
                                    });
                                    setSelectedItems(newSelectedItems);
                                  } else {
                                    setSelectedItems({});
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Item Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Item Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Sub Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredItems.filter(item => item && item._id).map((item) => {
                            // Check if this item was in the original order - try multiple matching strategies
                            const existingItem = Array.isArray(editingOrder?.items) ? 
                              editingOrder.items.find(i => {
                                // Try matching by itemId
                                if (i.itemId === item._id) return true;
                                // Try matching by _id
                                if (i._id === item._id) return true;
                                // Try matching by id
                                if (i.id === item._id) return true;
                                // Try matching by itemCode
                                if (i.itemCode === item.itemCode) return true;
                                // Try matching by code
                                if (i.code === item.itemCode) return true;
                                // Try matching by name
                                if (i.itemName === (item.nameEn || item.name)) return true;
                                if (i.name === (item.nameEn || item.name)) return true;
                                if (i.nameEn === (item.nameEn || item.name)) return true;
                                return false;
                              }) : null;
                            
                            const isSelected = !!selectedItems[item._id];
                            const currentQty = selectedItems[item._id]?.qty || 0;
                            
                            // Debug logging for item matching
                            if (existingItem) {
                              console.log(`Found existing item for ${item.itemCode}:`, {
                                itemId: item._id,
                                existingItem: existingItem,
                                isSelected: isSelected,
                                currentQty: currentQty
                              });
                            }
                            
                            return (
                              <tr key={item._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        // Remove item
                                        setSelectedItems(prev => {
                                          const newItems = { ...prev };
                                          delete newItems[item._id];
                                          return newItems;
                                        });
                                      } else {
                                        // Add item with existing quantity if it was already in the order
                                        const existingQty = existingItem ? (existingItem.qty || existingItem.quantity || 1) : 1;
                                        setSelectedItems(prev => ({
                                          ...prev,
                                          [item._id]: {
                                            itemId: item._id,
                                            itemName: item.nameEn || item.name,
                                            itemCode: item.itemCode,
                                            unit: item.unit?.name || item.baseUnit?.name,
                                            qty: existingQty,
                                            subCategory: item.subCategory?._id || ''
                                          }
                                        }));
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item?.itemCode || item?.code || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item?.nameEn || item?.name || 'Unknown Item'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item?.category?.nameEn || item?.category?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item?.subCategory?.nameEn || item?.subCategory?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item?.unit?.name || item?.baseUnit?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        const newQty = Math.max(0, currentQty - 1);
                                        setSelectedItems(prev => ({
                                          ...prev,
                                          [item._id]: {
                                            ...prev[item._id],
                                            qty: newQty
                                          }
                                        }));
                                      }}
                                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                      disabled={!isSelected}
                                    >
                                      -
                                    </button>
                                    <input 
                                      type="number" 
                                      min="0.01" 
                                      step="0.01"
                                      className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm" 
                                      value={currentQty} 
                                      onChange={(e) => {
                                        const newQty = parseFloat(e.target.value) || 0;
                                        setSelectedItems(prev => ({
                                          ...prev,
                                          [item._id]: {
                                            ...prev[item._id],
                                            qty: newQty
                                          }
                                        }));
                                      }}
                                      placeholder="0"
                                      disabled={!isSelected}
                                    />
                                    <button
                                      onClick={() => {
                                        const newQty = currentQty + 1;
                                        setSelectedItems(prev => ({
                                          ...prev,
                                          [item._id]: {
                                            ...prev[item._id],
                                            qty: newQty
                                          }
                                        }));
                                      }}
                                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                      disabled={!isSelected}
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-500 text-lg">No items found matching your criteria</div>
                          <button 
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedSectionFilter([]);
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 relative z-10">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {error && <div className="text-red-600">{error}</div>}
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={closeEditModal} 
                      className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit} 
                      className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
                      disabled={Object.keys(selectedItems).length === 0 || editSaving}
                      type="button"
                    >
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      </>
    );
};

export default OrderSubmission; 