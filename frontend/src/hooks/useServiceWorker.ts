import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  install: () => Promise<void>;
  showInstallPrompt: () => Promise<void>;
}

interface UseServiceWorkerReturn extends ServiceWorkerState, ServiceWorkerActions {}

let deferredPrompt: any = null;

export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstallable: false,
    isOffline: !navigator.onLine,
    registration: null,
    error: null
  });

  // Check if PWA is installable
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setState(prev => ({ ...prev, isInstallable: false }));
      console.log('PWA was installed');
    };

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      const error = new Error('Service Workers are not supported in this browser');
      setState(prev => ({ ...prev, error }));
      throw error;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available');
              // You can show a notification to the user here
            }
          });
        }
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null
      }));

      console.log('Service Worker registered successfully');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, [state.isSupported]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!state.registration) {
      return;
    }

    try {
      const result = await state.registration.unregister();
      if (result) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
          error: null
        }));
        console.log('Service Worker unregistered successfully');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      console.error('Service Worker unregistration failed:', error);
      throw error;
    }
  }, [state.registration]);

  // Update service worker
  const update = useCallback(async () => {
    if (!state.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await state.registration.update();
      console.log('Service Worker updated successfully');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }, [state.registration]);

  // Install PWA
  const install = useCallback(async () => {
    await showInstallPrompt();
  }, []);

  // Show install prompt
  const showInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      throw new Error('Install prompt is not available');
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      deferredPrompt = null;
      setState(prev => ({ ...prev, isInstallable: false }));
    } catch (error) {
      console.error('Error showing install prompt:', error);
      throw error;
    }
  }, []);

  // Auto-register on mount if supported
  useEffect(() => {
    if (state.isSupported && !state.isRegistered && process.env.NODE_ENV === 'production') {
      register().catch(console.error);
    }
  }, [state.isSupported, state.isRegistered, register]);

  return {
    ...state,
    register,
    unregister,
    update,
    install,
    showInstallPrompt
  };
};

// Utility function to check if app is running as PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
};

// Utility function to get PWA display mode
export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
};

export default useServiceWorker;