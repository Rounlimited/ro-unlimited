'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Bell, BellOff } from 'lucide-react';

// ── Service Worker Registration ──
function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service worker registered, scope:', reg.scope);
        // Check for updates periodically
        setInterval(() => reg.update(), 60 * 60 * 1000); // hourly
      }).catch((err) => {
        console.error('[PWA] SW registration failed:', err);
      });
    }
  }, []);
}

// ── Install Prompt ──
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  // Register service worker
  useServiceWorker();

  // Check if already installed
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    mq.addEventListener('change', (e) => setIsInstalled(e.matches));
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install banner if not dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 5 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Check notification permission
  useEffect(() => {
    if (!('Notification' in window)) {
      setNotifPermission('unsupported');
      return;
    }
    setNotifPermission(Notification.permission);
    // Show notification banner after install or if already installed
    if (isInstalled && Notification.permission === 'default') {
      const dismissed = localStorage.getItem('pwa-notif-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 3 * 24 * 60 * 60 * 1000) {
        setShowNotifBanner(true);
      }
    }
  }, [isInstalled]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  }, [deferredPrompt]);

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleEnableNotifications = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      setShowNotifBanner(false);

      if (permission === 'granted') {
        // Subscribe to push notifications
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
          ),
        });

        // Send subscription to server
        await fetch('/api/admin/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        });

        console.log('[PWA] Push subscription saved');
      }
    } catch (err) {
      console.error('[PWA] Notification setup failed:', err);
    }
  }, []);

  const dismissNotif = () => {
    setShowNotifBanner(false);
    localStorage.setItem('pwa-notif-dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-xl bg-[#1B2A4A] border border-[#D4772C]/30 p-4 shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4772C]/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-[#D4772C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Install RO Admin</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Add to your home screen for quick access and notifications
              </p>
            </div>
            <button onClick={dismissInstall} className="text-gray-500 hover:text-gray-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-[#D4772C] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[#c06a24] transition-colors"
            >
              Install App
            </button>
            <button
              onClick={dismissInstall}
              className="px-4 py-2 text-gray-400 text-sm hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Notification Permission Banner */}
      {showNotifBanner && notifPermission === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-xl bg-[#1B2A4A] border border-[#D4772C]/30 p-4 shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4772C]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#D4772C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Enable Notifications</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Get notified about new emails, leads, and project updates
              </p>
            </div>
            <button onClick={dismissNotif} className="text-gray-500 hover:text-gray-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnableNotifications}
              className="flex-1 bg-[#D4772C] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[#c06a24] transition-colors"
            >
              Enable Notifications
            </button>
            <button
              onClick={dismissNotif}
              className="px-4 py-2 text-gray-400 text-sm hover:text-white transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Convert VAPID key from base64 URL string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array();
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
