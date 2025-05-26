import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  domContentLoaded: number | null;
  loadComplete: number | null;
  
  // Custom metrics
  routeChangeTime: number | null;
  apiResponseTimes: { [endpoint: string]: number[] };
  errorCount: number;
  memoryUsage: {
    used: number;
    total: number;
  } | null;
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  [key: string]: any;
}

interface UsePerformanceMonitoringReturn {
  metrics: PerformanceMetrics;
  startMeasurement: (name: string) => void;
  endMeasurement: (name: string) => number | null;
  recordApiCall: (endpoint: string, duration: number) => void;
  recordError: (error: Error) => void;
  getAverageApiTime: (endpoint: string) => number | null;
  exportMetrics: () => string;
  clearMetrics: () => void;
}

const initialMetrics: PerformanceMetrics = {
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
  domContentLoaded: null,
  loadComplete: null,
  routeChangeTime: null,
  apiResponseTimes: {},
  errorCount: 0,
  memoryUsage: null
};

export const usePerformanceMonitoring = (): UsePerformanceMonitoringReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics);
  const measurementsRef = useRef<{ [key: string]: number }>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Observe Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        handlePerformanceEntry(entry as PerformanceEntry);
      }
    });

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation', 'measure'] });
      observerRef.current = observer;
    } catch (error) {
      console.warn('Error setting up PerformanceObserver:', error);
    }

    // Get initial navigation timing
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      setMetrics(prev => ({
        ...prev,
        ttfb: nav.responseStart - nav.requestStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
        loadComplete: nav.loadEventEnd // PERUBAHAN DI SINI
      }));
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize
          }
        }));
      };

      updateMemoryUsage();
      const memoryInterval = setInterval(updateMemoryUsage, 30000); // Every 30 seconds

      return () => {
        clearInterval(memoryInterval);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handlePerformanceEntry = useCallback((entry: PerformanceEntry) => {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        break;
      
      case 'first-input':
        setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        break;
      
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
        }
        break;
      
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
        break;
      
      case 'measure':
        if (entry.name.startsWith('route-change')) {
          setMetrics(prev => ({ ...prev, routeChangeTime: entry.duration }));
        }
        break;
    }
  }, []);

  const startMeasurement = useCallback((name: string) => {
    const timestamp = performance.now();
    measurementsRef.current[name] = timestamp;
    performance.mark(`${name}-start`);
  }, []);

  const endMeasurement = useCallback((name: string) => {
    const startTime = measurementsRef.current[name];
    if (!startTime) {
      console.warn(`No start measurement found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    delete measurementsRef.current[name];
    return duration;
  }, []);

  const recordApiCall = useCallback((endpoint: string, duration: number) => {
    setMetrics(prev => {
      const existingTimes = prev.apiResponseTimes[endpoint] || [];
      const updatedTimes = [...existingTimes, duration].slice(-10); // Keep last 10 measurements
      
      return {
        ...prev,
        apiResponseTimes: {
          ...prev.apiResponseTimes,
          [endpoint]: updatedTimes
        }
      };
    });
  }, []);

  const recordError = useCallback((error: Error) => {
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    
    // Report to monitoring service (implement based on your needs)
    console.error('Performance Monitor - Error recorded:', error);
  }, []);

  const getAverageApiTime = useCallback((endpoint: string) => {
    const times = metrics.apiResponseTimes[endpoint];
    if (!times || times.length === 0) return null;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }, [metrics.apiResponseTimes]);

  const exportMetrics = useCallback(() => {
    const exportData = {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics(initialMetrics);
    measurementsRef.current = {};
  }, []);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    recordApiCall,
    recordError,
    getAverageApiTime,
    exportMetrics,
    clearMetrics
  };
};

// Custom hook for monitoring React component performance
export const useComponentPerformance = (componentName: string) => {
  const { startMeasurement, endMeasurement } = usePerformanceMonitoring();
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    // Component mount time
    mountTimeRef.current = performance.now();
    startMeasurement(`${componentName}-mount`);
    
    return () => {
      // Component unmount time
      const mountDuration = endMeasurement(`${componentName}-mount`);
      if (mountDuration) {
        console.debug(`${componentName} mount duration: ${mountDuration.toFixed(2)}ms`);
      }
    };
  }, [componentName, startMeasurement, endMeasurement]);

  const measureRender = useCallback(() => {
    const renderStart = performance.now();
    
    return () => {
      const renderDuration = performance.now() - renderStart;
      console.debug(`${componentName} render duration: ${renderDuration.toFixed(2)}ms`);
    };
  }, [componentName]);

  return { measureRender };
};

// Web Vitals scoring utility
export const getWebVitalsScore = (metrics: PerformanceMetrics) => {
  const scores = {
    lcp: metrics.lcp ? (metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'needs-improvement' : 'poor') : null,
    fid: metrics.fid ? (metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'needs-improvement' : 'poor') : null,
    cls: metrics.cls ? (metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'needs-improvement' : 'poor') : null
  };

  const validScores = Object.values(scores).filter(score => score !== null);
  const goodScores = validScores.filter(score => score === 'good').length;
  const totalScores = validScores.length;

  return {
    individual: scores,
    overall: totalScores > 0 ? Math.round((goodScores / totalScores) * 100) : 0
  };
};

export default usePerformanceMonitoring;