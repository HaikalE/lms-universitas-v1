import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-50 disabled:text-gray-500
        placeholder-gray-400
        resize-vertical
        ${className}
      `}
      {...props}
    />
  );
};