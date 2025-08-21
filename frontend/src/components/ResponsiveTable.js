import React, { useState } from 'react';

const ResponsiveTable = ({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  onView,
  loading = false,
  searchQuery = '',
  onSearch,
  title = 'Data Table',
  showActions = true,
  customActions = [],
  mobileCardRender
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sort data
  const sortedData = React.useMemo(() => {
    // Filter out undefined/null items first
    const validData = data.filter(item => item != null);
    
    if (!sortConfig.key) return validData;
    
    return [...validData].sort((a, b) => {
      if (!a || !b) return 0; // Handle undefined items
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm border rounded-md ${
                currentPage === page 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderActions = (item) => {
    if (!item) return []; // Return empty array if item is undefined
    
    const actions = [];
    
    if (onView) {
      actions.push(
        <button
          key="view"
          onClick={() => onView(item)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          title="View"
        >
          View
        </button>
      );
    }
    
    if (onEdit) {
      actions.push(
        <button
          key="edit"
          onClick={() => onEdit(item)}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
          title="Edit"
        >
          Edit
        </button>
      );
    }
    
    if (onDelete) {
      actions.push(
        <button
          key="delete"
          onClick={() => onDelete(item._id || item.id)}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
          title="Delete"
        >
          Delete
        </button>
      );
    }
    
    customActions.forEach((action, index) => {
      actions.push(
        <button
          key={`custom-${index}`}
          onClick={() => action.onClick(item)}
          className={`${action.className || 'px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors'} p-1 rounded`}
          title={action.title}
        >
          {action.icon}
        </button>
      );
    });
    
    return actions;
  };

  const renderMobileCard = (item, index) => {
    if (!item) return null; // Skip undefined items
    if (mobileCardRender) {
      return mobileCardRender(item, index);
    }

    return (
      <div key={item._id || item.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-sm font-medium text-gray-600">{column.header || column.label}</span>
            <span className="text-sm text-gray-900">
              {column.render ? column.render(item) : (item[column.key] || 'N/A')}
            </span>
          </div>
        ))}
        {showActions && (
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
            {renderActions(item)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
          {onSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-gray-400">{getSortIcon(column.key)}</span>
                    )}
                  </div>
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => {
              if (!item) return null; // Skip undefined items
              return (
                <tr key={item._id || item.id || index} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item) : (item[column.key] || 'N/A')}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        {renderActions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((item, index) => {
            if (!item) return null; // Skip undefined items
            return renderMobileCard(item, index);
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200">
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable; 