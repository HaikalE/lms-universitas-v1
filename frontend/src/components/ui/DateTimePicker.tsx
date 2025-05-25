import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

interface DateTimePickerProps {
  value?: Date | string;
  onChange: (date: Date) => void;
  showTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  format?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  showTime = false,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Select date',
  format: dateFormat = showTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy',
  className = '',
  size = 'md',
  variant = 'default',
  required = false,
  error,
  label,
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? (typeof value === 'string' ? parseISO(value) : value) : new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(currentDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(currentDate.getMinutes());
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const date = typeof value === 'string' ? parseISO(value) : value;
      setCurrentDate(date);
      setViewDate(date);
      setSelectedHour(date.getHours());
      setSelectedMinute(date.getMinutes());
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(date);
    if (showTime) {
      newDate.setHours(selectedHour, selectedMinute);
    }
    setCurrentDate(newDate);
    onChange(newDate);
    
    if (!showTime) {
      setIsOpen(false);
    } else {
      setActiveTab('time');
    }
  };

  const handleTimeChange = () => {
    const newDate = new Date(currentDate);
    newDate.setHours(selectedHour, selectedMinute);
    setCurrentDate(newDate);
    onChange(newDate);
  };

  const handleApply = () => {
    if (showTime) {
      handleTimeChange();
    }
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = startOfMonth(viewDate);
    const lastDay = endOfMonth(viewDate);
    
    // Get days from previous month to fill the first week
    const startDay = firstDay.getDay();
    const prevMonthDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (i + 1));
      prevMonthDays.push(date);
    }
    
    // Get days from next month to fill the last week
    const endDay = lastDay.getDay();
    const nextMonthDays = [];
    for (let i = 1; i <= 6 - endDay; i++) {
      const date = new Date(lastDay);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }
    
    return [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
  };

  const formatDisplayValue = () => {
    if (!currentDate) return '';
    return format(currentDate, dateFormat);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={formatDisplayValue()}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`
            w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${sizeClasses[size]}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${variant === 'minimal' ? 'border-0 border-b-2 rounded-none bg-transparent' : ''}
          `}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Picker */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          {/* Tabs for date/time */}
          {showTime && (
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('date')}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'date'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                Date
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'time'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClockIcon className="w-4 h-4 inline mr-2" />
                Time
              </button>
            </div>
          )}

          {/* Date picker */}
          {(!showTime || activeTab === 'date') && (
            <div>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                <h3 className="text-lg font-semibold">
                  {format(viewDate, 'MMMM yyyy')}
                </h3>
                
                <button
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = isSameMonth(date, viewDate);
                  const isSelected = currentDate && isSameDay(date, currentDate);
                  const isTodayDate = isToday(date);
                  const isDisabled = isDateDisabled(date);

                  return (
                    <button
                      key={index}
                      onClick={() => !isDisabled && handleDateSelect(date)}
                      disabled={isDisabled}
                      className={`
                        w-8 h-8 text-sm rounded-lg transition-colors
                        ${!isCurrentMonth 
                          ? 'text-gray-300' 
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : isTodayDate
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time picker */}
          {showTime && activeTab === 'time' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {/* Hour */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hour</label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="block w-16 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="text-2xl font-bold text-gray-400 mt-6">:</div>
                
                {/* Minute */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minute</label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    className="block w-16 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Current time display */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Selected time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {`${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;