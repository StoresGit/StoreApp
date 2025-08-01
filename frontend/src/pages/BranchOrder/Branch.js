import React from 'react';

const Branch = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Branch Management</h1>
        <p className="text-gray-600 mb-4">Manage branch operations and configurations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Create Order</h3>
            <p className="text-sm text-blue-600">Create new orders for the branch</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Order Submission</h3>
            <p className="text-sm text-green-600">Submit orders to central kitchen</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Order History</h3>
            <p className="text-sm text-purple-600">Track order history and status</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">Inventory Control</h3>
            <p className="text-sm text-orange-600">Manage inventory and stock levels</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Branch; 