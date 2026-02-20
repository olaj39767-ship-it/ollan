'use client';

import { useState, useEffect } from 'react';

export default function PWAChecker() {
  const [checks, setChecks] = useState({
    https: false,
    manifest: false,
    serviceWorker: false,
    icons: false,
    standalone: false
  });

  useEffect(() => {
    const runChecks = async () => {
      // Check HTTPS
      const https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      
      // Check manifest
      let manifest = false;
      try {
        const response = await fetch('/manifest.json');
        manifest = response.ok;
      } catch (e) {
        manifest = false;
      }

      // Check service worker
      const serviceWorker = 'serviceWorker' in navigator;

      // Check icons (basic check)
      let icons = false;
      try {
        const response = await fetch('/icons/icon-192x192.png');
        icons = response.ok;
      } catch (e) {
        icons = false;
      }

      // Check standalone capability
      const standalone = window.matchMedia('(display-mode: standalone)').matches;

      setChecks({ https, manifest, serviceWorker, icons, standalone });
    };

    runChecks();
  }, []);

  return (
    <div className="fixed top-96 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm text-sm">
      <h3 className="font-bold mb-2">PWA Checklist:</h3>
      <div className="space-y-1">
        <div className={`flex items-center gap-2 ${checks.https ? 'text-green-600' : 'text-red-600'}`}>
          {checks.https ? '✓' : '✗'} HTTPS/Localhost
        </div>
        <div className={`flex items-center gap-2 ${checks.manifest ? 'text-green-600' : 'text-red-600'}`}>
          {checks.manifest ? '✓' : '✗'} Manifest
        </div>
        <div className={`flex items-center gap-2 ${checks.serviceWorker ? 'text-green-600' : 'text-red-600'}`}>
          {checks.serviceWorker ? '✓' : '✗'} Service Worker
        </div>
        <div className={`flex items-center gap-2 ${checks.icons ? 'text-green-600' : 'text-red-600'}`}>
          {checks.icons ? '✓' : '✗'} Icons
        </div>
        <div className={`flex items-center gap-2 ${checks.standalone ? 'text-green-600' : 'text-orange-600'}`}>
          {checks.standalone ? '✓' : '○'} Standalone Mode
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t text-xs text-gray-600">
        <p><strong>Desktop Install:</strong></p>
        <p>• Chrome: Address bar install icon</p>
        <p>• Edge: Menu → Apps → Install</p>
      </div>
    </div>
  );
}