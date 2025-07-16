import React from 'react';

const ResponsiveForm = ({ 
  title, 
  onSubmit, 
  onCancel, 
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  children,
  maxWidth = 'max-w-2xl',
  className = ''
}) => {
  return (
    <div className={`${maxWidth} mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        {title && (
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        
        {/* Form Content */}
        <form onSubmit={onSubmit} className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            {children}
          </div>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
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
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Form Field Components
export const FormField = ({ 
  label, 
  children, 
  required = false, 
  error = '', 
  help = '',
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="block text-sm md:text-base font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="text-sm text-red-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
    {help && !error && (
      <p className="text-sm text-gray-500">{help}</p>
    )}
  </div>
);

export const FormInput = ({ 
  type = 'text', 
  placeholder = '', 
  value = '', 
  onChange, 
  disabled = false,
  required = false,
  className = '',
  ...props
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    className={`w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-base disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
);

export const FormTextarea = ({ 
  placeholder = '', 
  value = '', 
  onChange, 
  disabled = false,
  required = false,
  rows = 3,
  className = '',
  ...props
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    rows={rows}
    className={`w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-base disabled:bg-gray-50 disabled:cursor-not-allowed resize-vertical ${className}`}
    {...props}
  />
);

export const FormSelect = ({ 
  value = '', 
  onChange, 
  disabled = false,
  required = false,
  children,
  className = '',
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    className={`w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-base disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const FormCheckbox = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  label = '',
  className = '',
  ...props
}) => (
  <div className={`flex items-center ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
      {...props}
    />
    {label && (
      <label className="ml-2 text-sm md:text-base text-gray-700">
        {label}
      </label>
    )}
  </div>
);

export const FormRadioGroup = ({ 
  options = [], 
  value = '', 
  onChange, 
  disabled = false,
  name = '',
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {options.map((option, index) => (
      <div key={index} className="flex items-center">
        <input
          type="radio"
          id={`${name}-${index}`}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:cursor-not-allowed"
        />
        <label 
          htmlFor={`${name}-${index}`}
          className="ml-2 text-sm md:text-base text-gray-700"
        >
          {option.label}
        </label>
      </div>
    ))}
  </div>
);

export const FormGrid = ({ 
  children, 
  cols = 2, 
  gap = 4,
  className = ''
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-${gap} ${className}`}>
    {children}
  </div>
);

export const FormSection = ({ 
  title, 
  children, 
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {title && (
      <div className="border-b border-gray-200 pb-2">
        <h4 className="text-base md:text-lg font-medium text-gray-900">{title}</h4>
      </div>
    )}
    {children}
  </div>
);

export default ResponsiveForm; 