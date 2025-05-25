import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  getDay
} from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'assignment' | 'exam' | 'lecture' | 'meeting' | 'holiday' | 'deadline';
  location?: string;
  attendees?: string[];
  course?: string;
  priority: 'low' | 'medium' | 'high';
  color?: string;
  url?: string;
  metadata?: Record<string, any>;
}

interface AdvancedCalendarProps {
  events: CalendarEvent[];
  view?: 'month' | 'week' | 'day';
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  showWeekends?: boolean;
  showEventDetails?: boolean;
  className?: string;
  loading?: boolean;
}

const AdvancedCalendar: React.FC<AdvancedCalendarProps> = ({
  events,
  view = 'month',
  selectedDate = new Date(),
  onDateSelect,
  onEventClick,
  onEventCreate,
  onViewChange,
  showWeekends = true,
  showEventDetails = true,
  className = '',
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);

  const eventTypeColors = {
    assignment: 'bg-blue-500',
    exam: 'bg-red-500',
    lecture: 'bg-green-500',
    meeting: 'bg-purple-500',
    holiday: 'bg-orange-500',
    deadline: 'bg-yellow-500'
  };

  const eventTypeBorders = {
    assignment: 'border-blue-500',
    exam: 'border-red-500',
    lecture: 'border-green-500',
    meeting: 'border-purple-500',
    holiday: 'border-orange-500',
    deadline: 'border-yellow-500'
  };

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [events]);

  // Get calendar days based on view
  const calendarDays = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  }, [currentDate, view]);

  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    onDateSelect?.(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    onEventCreate?.(date);
  };

  const renderEvent = (event: CalendarEvent, isCompact: boolean = false) => {
    const color = event.color || eventTypeColors[event.type];
    const borderColor = eventTypeBorders[event.type];
    
    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          ${color} text-white text-xs p-1 rounded cursor-pointer border-l-2 ${borderColor}
          hover:opacity-80 transition-opacity
          ${isCompact ? 'mb-1' : 'mb-1 p-2'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
        onMouseEnter={() => setHoveredEvent(event)}
        onMouseLeave={() => setHoveredEvent(null)}
        title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
      >
        <div className="font-medium truncate">{event.title}</div>
        {!isCompact && showEventDetails && (
          <>
            <div className="flex items-center mt-1 text-xs opacity-90">
              <ClockIcon className="w-3 h-3 mr-1" />
              {format(event.startDate, 'HH:mm')}
              {event.startDate.getTime() !== event.endDate.getTime() && (
                <> - {format(event.endDate, 'HH:mm')}</>
              )}
            </div>
            {event.location && (
              <div className="flex items-center mt-1 text-xs opacity-90">
                <MapPinIcon className="w-3 h-3 mr-1" />
                {event.location}
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  };

  const renderMonthView = () => {
    const daysOfWeek = showWeekends 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    const filteredDays = showWeekends 
      ? calendarDays 
      : calendarDays.filter(day => getDay(day) !== 0 && getDay(day) !== 6);

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Week days header */}
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {filteredDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                bg-white min-h-32 p-2 cursor-pointer transition-colors
                ${!isCurrentMonth ? 'opacity-40' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${isTodayDate ? 'bg-blue-50' : ''}
                hover:bg-gray-50
              `}
              onClick={() => handleDateClick(day)}
              onDoubleClick={() => handleDateDoubleClick(day)}
            >
              <div className={`
                text-sm mb-2 font-medium
                ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => renderEvent(event, true))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex flex-col">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-px bg-gray-200 mb-4">
          <div className="bg-gray-50 p-2"></div>
          {calendarDays.map(day => {
            const isTodayDate = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  bg-white p-2 text-center cursor-pointer transition-colors
                  ${isTodayDate ? 'bg-blue-50 text-blue-600' : ''}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  hover:bg-gray-50
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-xs text-gray-500">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-semibold">
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {/* Time column */}
            <div className="bg-gray-50">
              {hours.map(hour => (
                <div key={hour} className="h-16 p-2 text-xs text-gray-500 border-b border-gray-200">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {calendarDays.map(day => {
              const dayEvents = getEventsForDate(day);
              
              return (
                <div key={day.toISOString()} className="bg-white relative">
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => {
                        const eventDate = new Date(day);
                        eventDate.setHours(hour, 0, 0, 0);
                        handleDateDoubleClick(eventDate);
                      }}
                    />
                  ))}
                  
                  {/* Events */}
                  {dayEvents.map(event => {
                    const startHour = event.startDate.getHours();
                    const startMinute = event.startDate.getMinutes();
                    const duration = (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60);
                    const top = (startHour + startMinute / 60) * 64; // 64px per hour
                    const height = Math.max(duration * 64, 20);
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
                          absolute left-1 right-1 ${eventTypeColors[event.type]} text-white p-1 rounded text-xs
                          cursor-pointer hover:opacity-80 transition-opacity z-10
                        `}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-90">
                          {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="flex flex-col">
        {/* Day header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              {format(currentDate, 'EEEE')}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
        </div>
        
        {/* Events for the day */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            Events ({dayEvents.length})
          </h3>
          
          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 ${eventTypeColors[event.type]} rounded-full mt-1`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center">
                          <UserGroupIcon className="w-3 h-3 mr-1" />
                          {event.attendees.length} attendees
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onEventClick?.(event)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No events scheduled for this day</p>
              <button
                onClick={() => onEventCreate?.(currentDate)}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Create an event
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
            {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map(viewType => (
              <button
                key={viewType}
                onClick={() => {
                  onViewChange?.(viewType);
                }}
                className={`
                  px-3 py-1 text-sm font-medium rounded transition-colors
                  ${view === viewType 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
          
          {onEventCreate && (
            <button
              onClick={() => onEventCreate(currentDate)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Event
            </button>
          )}
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Event tooltip */}
      <AnimatePresence>
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="font-medium">{hoveredEvent.title}</div>
            {hoveredEvent.description && (
              <div className="text-sm opacity-90 mt-1">{hoveredEvent.description}</div>
            )}
            <div className="text-xs opacity-75 mt-2">
              {format(hoveredEvent.startDate, 'MMM d, HH:mm')} - {format(hoveredEvent.endDate, 'HH:mm')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedCalendar;