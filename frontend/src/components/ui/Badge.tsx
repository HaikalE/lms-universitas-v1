import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
  };
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500',
    error: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
  };

  return (
    <span
      className={cn(baseClasses, sizeClasses[size], variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};