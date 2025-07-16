import React from 'react';

const InventoryControl = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory Control</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage and monitor branch inventory levels
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 bg-red-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Inventory control features are currently under development. 
            This module will provide comprehensive inventory management, 
            stock monitoring, and automated reorder capabilities.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="font-semibold text-gray-900 mb-2">Stock Monitoring</h3>
              <p className="text-sm text-gray-600">
                Real-time stock level monitoring
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Low Stock Alerts</h3>
              <p className="text-sm text-gray-600">
                Automated low stock notifications
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto Reorder</h3>
              <p className="text-sm text-gray-600">
                Automatic reorder suggestions
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold text-gray-900 mb-2">Usage Analytics</h3>
              <p className="text-sm text-gray-600">
                Track item usage patterns
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Stock Count</h3>
              <p className="text-sm text-gray-600">
                Physical inventory counting tools
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Inventory Reports</h3>
              <p className="text-sm text-gray-600">
                Generate inventory reports
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryControl; 