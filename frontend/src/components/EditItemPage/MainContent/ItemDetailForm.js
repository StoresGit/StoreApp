import React from 'react';

export default function ItemDetailsForm({ item }) {
  if (!item) return null;

  return (
    <div className="flex-1 bg-white p-4 rounded shadow-sm">
      <h3 className="font-semibold text-md mb-4">Basic Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (English) *</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.nameEn || ''}
            readOnly
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (Alternative)</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.nameAlt || ''}
            readOnly
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit *</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.baseUnit?.name || item.unit?.name || ''}
            readOnly
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.itemCode || ''}
            readOnly
          />
        </div>
      </div>

      <h3 className="font-semibold text-md mt-6 mb-4">Category Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.category?.nameEn || ''}
            readOnly
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
          <input
            className="w-full border p-2 rounded"
            defaultValue={item.subCategory?.nameEn || ''}
            readOnly
          />
        </div>
      </div>
    </div>  
  );
}
