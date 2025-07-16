import React from 'react';

const BranchOrderBranch = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage branch operations, orders, and inventory
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 bg-blue-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">🏢</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Branch management features are currently under development. 
            This module will provide comprehensive tools for managing branch operations, 
            order processing, and inventory control.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Order</h3>
              <p className="text-sm text-gray-600">
                Create and manage new branch orders
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📤</div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Submission</h3>
              <p className="text-sm text-gray-600">
                Submit and track order processing
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Order History</h3>
              <p className="text-sm text-gray-600">
                View order history and tracking
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Inventory Control</h3>
              <p className="text-sm text-gray-600">
                Manage inventory levels
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchOrderBranch; 