import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
  optional?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  showConnectors?: boolean;
  showDescriptions?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'numbered';
  className?: string;
  onStepClick?: (step: ProgressStep, index: number) => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  orientation = 'horizontal',
  showConnectors = true,
  showDescriptions = true,
  size = 'md',
  variant = 'default',
  className = '',
  onStepClick
}) => {
  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6',
      text: 'text-xs',
      connector: 'h-0.5'
    },
    md: {
      circle: 'w-8 h-8',
      text: 'text-sm',
      connector: 'h-1'
    },
    lg: {
      circle: 'w-10 h-10',
      text: 'text-base',
      connector: 'h-1.5'
    }
  };

  const currentStepIndex = steps.findIndex(step => step.status === 'current');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const getStepStatusClasses = (status: string, optional: boolean = false) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-600 border-green-600 text-white',
          text: 'text-green-600 font-medium',
          connector: 'bg-green-600'
        };
      case 'current':
        return {
          circle: 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100',
          text: 'text-blue-600 font-medium',
          connector: 'bg-gray-200'
        };
      case 'upcoming':
        return {
          circle: optional 
            ? 'bg-gray-100 border-gray-300 text-gray-400 border-dashed' 
            : 'bg-white border-gray-300 text-gray-400',
          text: 'text-gray-400',
          connector: 'bg-gray-200'
        };
      default:
        return {
          circle: 'bg-gray-100 border-gray-300 text-gray-400',
          text: 'text-gray-400',
          connector: 'bg-gray-200'
        };
    }
  };

  const renderStepContent = (step: ProgressStep, index: number) => {
    const statusClasses = getStepStatusClasses(step.status, step.optional);
    const isClickable = onStepClick && (step.status === 'completed' || step.status === 'current');

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`
          relative flex items-center
          ${orientation === 'vertical' ? 'pb-8' : ''}
          ${isClickable ? 'cursor-pointer group' : ''}
        `}
        onClick={() => isClickable && onStepClick?.(step, index)}
      >
        {/* Step Circle */}
        <div className="relative flex items-center justify-center">
          <div
            className={`
              ${sizeClasses[size].circle}
              border-2 rounded-full flex items-center justify-center transition-all duration-200
              ${statusClasses.circle}
              ${isClickable ? 'group-hover:scale-110' : ''}
            `}
          >
            {step.status === 'completed' ? (
              <CheckIcon className="w-4 h-4" />
            ) : variant === 'numbered' ? (
              <span className={`${sizeClasses[size].text} font-semibold`}>
                {index + 1}
              </span>
            ) : (
              <div className={`w-2 h-2 rounded-full ${
                step.status === 'current' ? 'bg-white' : 'bg-current'
              }`} />
            )}
          </div>

          {/* Optional Badge */}
          {step.optional && (
            <div className="absolute -top-1 -right-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
              Optional
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className={`
          ${orientation === 'horizontal' ? 'ml-4' : 'ml-4 flex-1'}
          ${variant === 'minimal' ? 'hidden sm:block' : ''}
        `}>
          <div className={`${sizeClasses[size].text} ${statusClasses.text} transition-colors duration-200`}>
            {step.title}
          </div>
          {showDescriptions && step.description && (
            <div className={`text-xs text-gray-500 mt-1 ${orientation === 'horizontal' ? 'max-w-32' : ''}`}>
              {step.description}
            </div>
          )}
        </div>

        {/* Connector Line */}
        {showConnectors && index < steps.length - 1 && (
          <div className="absolute">
            {orientation === 'horizontal' ? (
              <div
                className={`
                  ${sizeClasses[size].connector}
                  w-full bg-gray-200 transition-colors duration-500
                  ${index < currentStepIndex ? 'bg-green-600' : ''}
                `}
                style={{
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 'calc(100% - 2rem)'
                }}
              />
            ) : (
              <div
                className={`
                  w-0.5 bg-gray-200 transition-colors duration-500
                  ${index < currentStepIndex ? 'bg-green-600' : ''}
                `}
                style={{
                  left: '50%',
                  top: '100%',
                  transform: 'translateX(-50%)',
                  height: '2rem'
                }}
              />
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Progress Bar (for horizontal layout) */}
      {orientation === 'horizontal' && variant !== 'minimal' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress
            </span>
            <span className="text-sm text-gray-500">
              {completedSteps} of {steps.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className={`
        ${orientation === 'horizontal' 
          ? 'flex items-start space-x-8 overflow-x-auto pb-2' 
          : 'space-y-0'
        }
      `}>
        {steps.map((step, index) => renderStepContent(step, index))}
      </div>

      {/* Summary (for vertical layout) */}
      {orientation === 'vertical' && variant !== 'minimal' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;