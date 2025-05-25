import { useState, useEffect, useCallback, useRef } from 'react';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  focusVisible: boolean;
  screenReader: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'auto';
}

interface AccessibilityActions {
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: AccessibilityState['fontSize']) => void;
  setColorScheme: (scheme: AccessibilityState['colorScheme']) => void;
  announceToScreenReader: (message: string) => void;
  focusElement: (selector: string) => void;
  trapFocus: (container: HTMLElement) => () => void;
}

interface UseAccessibilityReturn extends AccessibilityState, AccessibilityActions {}

const STORAGE_KEY = 'lms-accessibility-preferences';

// Screen reader detection
const detectScreenReader = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  const userAgent = window.navigator.userAgent.toLowerCase();
  const screenReaders = ['nvda', 'jaws', 'dragon', 'voiceover', 'talkback'];
  
  return screenReaders.some(sr => userAgent.includes(sr)) ||
         window.speechSynthesis?.getVoices().length > 0 ||
         'speechSynthesis' in window;
};

export const useAccessibility = (): UseAccessibilityReturn => {
  const announcementRef = useRef<HTMLDivElement | null>(null);
  
  const [state, setState] = useState<AccessibilityState>(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const preferences = stored ? JSON.parse(stored) : {};
    
    return {
      reducedMotion: preferences.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: preferences.highContrast ?? window.matchMedia('(prefers-contrast: high)').matches,
      focusVisible: preferences.focusVisible ?? true,
      screenReader: detectScreenReader(),
      fontSize: preferences.fontSize ?? 'medium',
      colorScheme: preferences.colorScheme ?? 'auto'
    };
  });

  // Save preferences to localStorage
  useEffect(() => {
    const preferences = {
      reducedMotion: state.reducedMotion,
      highContrast: state.highContrast,
      focusVisible: state.focusVisible,
      fontSize: state.fontSize,
      colorScheme: state.colorScheme
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [state]);

  // Listen for system preference changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      if (state.colorScheme === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, [state.colorScheme]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    root.style.setProperty('--motion-duration', state.reducedMotion ? '0ms' : '300ms');
    root.classList.toggle('reduce-motion', state.reducedMotion);
    
    // High contrast
    root.classList.toggle('high-contrast', state.highContrast);
    
    // Focus visible
    root.classList.toggle('focus-visible', state.focusVisible);
    
    // Font size
    root.setAttribute('data-font-size', state.fontSize);
    
    // Color scheme
    if (state.colorScheme === 'dark') {
      root.classList.add('dark');
    } else if (state.colorScheme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto - follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [state]);

  // Create announcement element for screen readers
  useEffect(() => {
    if (!announcementRef.current) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcement);
      announcementRef.current = announcement;
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
        announcementRef.current = null;
      }
    };
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, reducedMotion: enabled }));
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, highContrast: enabled }));
  }, []);

  const setFontSize = useCallback((size: AccessibilityState['fontSize']) => {
    setState(prev => ({ ...prev, fontSize: size }));
  }, []);

  const setColorScheme = useCallback((scheme: AccessibilityState['colorScheme']) => {
    setState(prev => ({ ...prev, colorScheme: scheme }));
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      
      // Clear after a delay to allow for re-announcement of the same message
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      
      // Scroll into view if needed
      element.scrollIntoView({
        behavior: state.reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      });
    }
  }, [state.reducedMotion]);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Focus should return to the element that triggered the trap
        const triggerElement = document.querySelector('[data-focus-trigger]') as HTMLElement;
        if (triggerElement) {
          triggerElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return {
    ...state,
    setReducedMotion,
    setHighContrast,
    setFontSize,
    setColorScheme,
    announceToScreenReader,
    focusElement,
    trapFocus
  };
};

// Hook for managing skip links
export const useSkipLinks = () => {
  const [skipLinks] = useState([
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' },
    { href: '#footer', label: 'Skip to footer' }
  ]);

  const SkipLinks: React.FC = () => (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
        >
          {link.label}
        </a>
      ))}
    </div>
  );

  return { SkipLinks };
};

// Hook for managing focus management in SPAs
export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { announceToScreenReader } = useAccessibility();

  const handleRouteChange = useCallback((routeName: string) => {
    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    
    // Announce route change to screen readers
    announceToScreenReader(`Navigated to ${routeName}`);
  }, [announceToScreenReader]);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  return {
    handleRouteChange,
    restoreFocus
  };
};

export default useAccessibility;