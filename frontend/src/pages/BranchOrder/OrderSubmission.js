import React from 'react';

const OrderSubmission = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order Submission</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Submit and track order processing status
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 bg-blue-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">📤</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Order submission and processing features are currently under development. 
            This module will streamline the order submission process and provide 
            real-time tracking of order status.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Review</h3>
              <p className="text-sm text-gray-600">
                Review order details before submission
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit Orders</h3>
              <p className="text-sm text-gray-600">
                Submit orders to central kitchen
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Status Tracking</h3>
              <p className="text-sm text-gray-600">
                Track order processing status
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
              <p className="text-sm text-gray-600">
                Receive status update notifications
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile Access</h3>
              <p className="text-sm text-gray-600">
                Submit orders from mobile devices
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto Sync</h3>
              <p className="text-sm text-gray-600">
                Automatic synchronization with central system
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSubmission; 