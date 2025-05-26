import React from 'react';
import { CheckIcon } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  size = 'md',
  variant = 'default',
  className = '',
  id,
  checked,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: 'border-gray-300 text-primary-600 focus:ring-primary-500',
    primary: 'border-primary-300 text-primary-600 focus:ring-primary-500',
    success: 'border-green-300 text-green-600 focus:ring-green-500',
    warning: 'border-yellow-300 text-yellow-600 focus:ring-yellow-500',
    danger: 'border-red-300 text-red-600 focus:ring-red-500',
  };

  const checkboxId = id || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            rounded border-2 focus:ring-2 focus:ring-offset-2 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300 text-red-600 focus:ring-red-500' : ''}
          `}
          {...props}
        />
      </div>
      
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label 
              htmlFor={checkboxId} 
              className={`
                font-medium cursor-pointer
                ${disabled ? 'text-gray-400' : 'text-gray-900'}
                ${error ? 'text-red-600' : ''}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={`
              text-gray-500 mt-0.5
              ${disabled ? 'text-gray-400' : ''}
            `}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-red-600 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
export { Checkbox };
