import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceWorker } from '../../hooks/useServiceWorker';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss,
  className = ''
}) => {
  const { isInstallable, install } = useServiceWorker();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
      onInstall?.();
      setIsDismissed(true);
    } catch (error) {
      console.error('Failed to install PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mx-auto max-w-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Install LMS App
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Get the full app experience with offline access and faster loading.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Features */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              Offline access
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              Faster loading
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              Push notifications
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              App-like experience
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Maybe Later
            </button>
            
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Install Now
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// PWA Status Banner Component
export const PWAStatusBanner: React.FC = () => {
  const { isOffline, isRegistered } = useServiceWorker();
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(isOffline);
  }, [isOffline]);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium"
    >
      <div className="flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
        {isOffline ? (
          isRegistered ? (
            'You\'re offline. Some features may be limited.'
          ) : (
            'You\'re offline and the app isn\'t installed. Install for better offline experience.'
          )
        ) : (
          'You\'re back online!'
        )}
        
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
          aria-label="Close banner"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Device-specific install instructions
export const InstallInstructions: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const instructions = {
    ios: [
      'Tap the share button in Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to install the app'
    ],
    android: [
      'Tap the menu (three dots) in Chrome',
      'Select "Add to Home screen"',
      'Tap "Add" to install the app'
    ],
    desktop: [
      'Look for the install icon in your browser\'s address bar',
      'Click the install button or use browser menu',
      'Follow the installation prompts'
    ]
  };

  const PlatformIcon = platform === 'desktop' ? ComputerDesktopIcon : DevicePhoneMobileIcon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <PlatformIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Install Instructions
            </h3>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close instructions"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {instructions[platform].map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                {index + 1}
              </div>
              <p className="text-gray-700 text-sm">{step}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InstallPrompt;