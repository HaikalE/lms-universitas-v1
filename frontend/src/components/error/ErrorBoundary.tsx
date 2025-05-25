import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  showDetails?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  level: string;
  errorId: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: this.props.level || 'component',
      errorId: this.state.errorId
    };

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', errorDetails);
    }

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorDetails);
    }
  }

  private reportError = async (errorDetails: any) => {
    try {
      // Replace with your error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorDetails)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetError = () => {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    } else {
      // Max retries reached, show permanent error state
      console.warn('Max retries reached for ErrorBoundary');
    }
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          level={this.props.level || 'component'}
          errorId={this.state.errorId || 'unknown'}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  level,
  errorId
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const sendReport = async () => {
    try {
      // Simulate sending error report
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportSent(true);
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  };

  const errorTitle = {
    page: 'Page Error',
    component: 'Component Error',
    critical: 'Critical System Error'
  }[level] || 'Error';

  const errorDescription = {
    page: 'This page encountered an error and cannot be displayed.',
    component: 'A component on this page has encountered an error.',
    critical: 'A critical system error has occurred. Please contact support.'
  }[level] || 'An error has occurred.';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-8 ${
        level === 'critical' ? 'min-h-screen bg-red-50' : 
        level === 'page' ? 'min-h-96 bg-gray-50 rounded-lg' :
        'min-h-48 bg-gray-50 rounded border-2 border-dashed border-gray-300'
      }`}
    >
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className={`mx-auto mb-4 ${
          level === 'critical' ? 'w-16 h-16' : 'w-12 h-12'
        }`}>
          <ExclamationTriangleIcon className={`w-full h-full ${
            level === 'critical' ? 'text-red-500' : 'text-orange-500'
          }`} />
        </div>

        {/* Error Title */}
        <h2 className={`font-bold text-gray-900 mb-2 ${
          level === 'critical' ? 'text-2xl' : 'text-lg'
        }`}>
          {errorTitle}
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          {errorDescription}
        </p>

        {/* Error ID */}
        <p className="text-xs text-gray-500 mb-4 font-mono">
          Error ID: {errorId}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            {level === 'page' || level === 'critical' ? (
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Go Home
              </button>
            ) : null}
          </div>

          {/* Report Error */}
          <div className="text-center">
            {!reportSent ? (
              <button
                onClick={sendReport}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Report this error
              </button>
            ) : (
              <span className="text-sm text-green-600">
                ✓ Error report sent
              </span>
            )}
          </div>
        </div>

        {/* Toggle Details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </button>
          </div>
        )}
      </div>

      {/* Error Details (Development Only) */}
      {showDetails && process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-8 w-full max-w-4xl"
        >
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
            <div className="mb-4">
              <h3 className="text-red-400 font-bold mb-2">Error:</h3>
              <p>{error.name}: {error.message}</p>
            </div>
            
            {error.stack && (
              <div className="mb-4">
                <h3 className="text-red-400 font-bold mb-2">Stack Trace:</h3>
                <pre className="whitespace-pre-wrap text-xs">
                  {error.stack}
                </pre>
              </div>
            )}
            
            {errorInfo.componentStack && (
              <div>
                <h3 className="text-red-400 font-bold mb-2">Component Stack:</h3>
                <pre className="whitespace-pre-wrap text-xs">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Higher-order component for easy error boundary wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Log error
    console.error('Manual error report:', errorDetails);

    // Report to error service in production
    if (process.env.NODE_ENV === 'production') {
      // Implement error reporting service call
    }
  }, []);

  return { handleError };
};

export default ErrorBoundary;