import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  className = '', 
  color = 'primary' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-primary-600',
    secondary: 'border-gray-300 border-t-gray-600',
    white: 'border-gray-300 border-t-white',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
    </div>
  );
};

export default Loader;
export { Loader };
