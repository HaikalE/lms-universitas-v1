/**
 * Date utility functions for formatting and deadline status
 */

export type FormatType = 'full' | 'short' | 'relative' | 'time' | 'date';
export type DeadlineStatus = 'urgent' | 'warning' | 'normal';

/**
 * Format a date according to the specified format type
 */
export function formatDate(date: string | Date, format: FormatType = 'full'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  switch (format) {
    case 'full':
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'short':
      return dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

    case 'date':
      return dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

    case 'time':
      return dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

    case 'relative':
      if (diffInMinutes < 1) {
        return 'Baru saja';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`;
      } else if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`;
      } else if (diffInDays < 7) {
        return `${diffInDays} hari yang lalu`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} minggu yang lalu`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} bulan yang lalu`;
      } else {
        const years = Math.floor(diffInDays / 365);
        return `${years} tahun yang lalu`;
      }

    default:
      return dateObj.toLocaleDateString('id-ID');
  }
}

/**
 * Get deadline status based on how close the deadline is
 */
export function getDeadlineStatus(deadline: string | Date): DeadlineStatus {
  const deadlineObj = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffInMs = deadlineObj.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // If deadline has passed
  if (diffInMs < 0) {
    return 'urgent';
  }

  // Less than 24 hours = urgent
  if (diffInHours < 24) {
    return 'urgent';
  }

  // Less than 3 days = warning
  if (diffInDays < 3) {
    return 'warning';
  }

  // More than 3 days = normal
  return 'normal';
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is this week
 */
export function isThisWeek(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
}

/**
 * Get time until deadline in readable format
 */
export function getTimeUntilDeadline(deadline: string | Date): string {
  const deadlineObj = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffInMs = deadlineObj.getTime() - now.getTime();

  if (diffInMs < 0) {
    return 'Sudah lewat';
  }

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 0) {
    return `${diffInDays} hari lagi`;
  } else if (diffInHours > 0) {
    return `${diffInHours} jam lagi`;
  } else {
    return `${diffInMinutes} menit lagi`;
  }
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
