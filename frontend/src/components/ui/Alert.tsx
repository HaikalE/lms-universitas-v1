import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  children, 
  onClose,
  className = '' 
}) => {
  const variantStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className={`w-5 h-5 ${iconStyles[variant]}`} />;
      case 'error':
        return <XCircle className={`w-5 h-5 ${iconStyles[variant]}`} />;
      case 'warning':
        return <AlertCircle className={`w-5 h-5 ${iconStyles[variant]}`} />;
      case 'info':
        return <Info className={`w-5 h-5 ${iconStyles[variant]}`} />;
      default:
        return <Info className={`w-5 h-5 ${iconStyles[variant]}`} />;
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${variantStyles[variant]} ${className}`}>
      {getIcon()}
      <div className="flex-1">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
export { Alert };
