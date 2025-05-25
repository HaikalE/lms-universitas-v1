import React from 'react';
import { XCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`flex items-start gap-3 p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg ${className}`}>
      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline transition-colors"
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
export { ErrorMessage };
