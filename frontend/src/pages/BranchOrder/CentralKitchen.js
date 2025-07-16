import React from 'react';

const BranchOrderCentralKitchen = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Central Kitchen</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage central kitchen operations and production
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 bg-orange-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">👨‍🍳</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Central Kitchen management features are currently under development. 
            This module will include production planning, recipe management, and 
            kitchen operations tracking.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Production Planning</h3>
              <p className="text-sm text-gray-600">
                Plan and schedule production activities
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-semibold text-gray-900 mb-2">Recipe Management</h3>
              <p className="text-sm text-gray-600">
                Manage recipes and cooking instructions
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Kitchen Operations</h3>
              <p className="text-sm text-gray-600">
                Track kitchen efficiency and operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchOrderCentralKitchen; 