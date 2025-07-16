import React, { useEffect } from 'react';

const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md md:max-w-lg',
    lg: 'max-w-lg md:max-w-2xl',
    xl: 'max-w-xl md:max-w-4xl',
    full: 'max-w-full'
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative w-full ${sizeClasses[size]} 
          bg-white rounded-lg shadow-xl transform transition-all
          ${className}
        `}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  const typeStyles = {
    warning: {
      icon: '⚠️',
      confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
      iconBg: 'bg-yellow-100'
    },
    danger: {
      icon: '🗑️',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-100'
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-100'
    }
  };

  const currentType = typeStyles[type] || typeStyles.warning;

  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm"
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${currentType.iconBg} mb-4`}>
          <span className="text-2xl">{currentType.icon}</span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${currentType.confirmClass} transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

// Loading Modal Component
export const LoadingModal = ({ 
  isOpen, 
  message = 'Loading...',
  showProgress = false,
  progress = 0
}) => {
  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={() => {}} 
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        
        <p className="text-lg font-medium text-gray-900 mb-2">
          {message}
        </p>
        
        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

// Image Modal Component
export const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageAlt = 'Image',
  title
}) => {
  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      title={title}
    >
      <div className="text-center">
        <img 
          src={imageUrl} 
          alt={imageAlt}
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
        />
      </div>
    </ResponsiveModal>
  );
};

// Form Modal Component
export const FormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  size = 'md'
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size={size}
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              submitText
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default ResponsiveModal; 