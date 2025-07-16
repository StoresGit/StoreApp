import React from 'react';

const OrderHistory = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order History & Tracking</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            View order history and track delivery status
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 bg-purple-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">📋</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Order history and tracking features are currently under development. 
            This module will provide comprehensive order history, delivery tracking, 
            and performance analytics.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Order History</h3>
              <p className="text-sm text-gray-600">
                View complete order history
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Tracking</h3>
              <p className="text-sm text-gray-600">
                Real-time delivery status tracking
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-sm text-gray-600">
                Analyze order performance metrics
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
              <p className="text-sm text-gray-600">
                Advanced search and filtering options
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
              <p className="text-sm text-gray-600">
                Detailed order information and status
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Reports</h3>
              <p className="text-sm text-gray-600">
                Generate order history reports
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory; 