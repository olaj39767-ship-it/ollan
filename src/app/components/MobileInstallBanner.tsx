'use client';

import { useState, useEffect } from 'react';

export default function MobileInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('install-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Detect mobile platforms
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    const isMobile = iOS || android;
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Show banner only on mobile and not installed
    if (isMobile && !standalone && !wasDismissed) {
      setTimeout(() => setShowBanner(true), 5000); // Show after 5 seconds
    }
  }, []);

  const handleInstall = () => {
    if (isIOS) {
      alert(`Install Ollan Pharmacy:

📱 Tap the Share button (□↗) at the bottom
📱 Scroll down and tap "Add to Home Screen"  
📱 Tap "Add" to confirm

You'll find the app on your home screen!`);
    } else if (isAndroid) {
      alert(`Install Ollan Pharmacy:

📱 Tap the browser menu (⋮)
📱 Look for "Add to Home Screen" or "Install"
📱 Tap to add the app

You'll find the app in your app drawer!`);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  if (!showBanner || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 shadow-lg z-50 animate-slide-down">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
            OP
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Install Ollan Pharmacy</p>
            <p className="text-xs opacity-90">
              {isIOS ? 'Add to your home screen for quick access' : 'Get the app experience'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-blue-700 p-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}