import { useEffect, useState } from 'react';

/**
 * @hook useOnlineStatus
 * @description Reactively tracks the browser's network connectivity state.
 *
 * Uses the native browser `online`/`offline` events which fire automatically
 * when the network is gained or lost — no polling required.
 *
 * This is the single source of truth for offline awareness across the app.
 * When migrating to a C# API, this hook remains unchanged — it's purely
 * a browser capability, not coupled to any backend.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justCameBackOnline, setJustCameBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger a "connection restored" toast for 3 seconds
      setJustCameBackOnline(true);
      setTimeout(() => setJustCameBackOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, justCameBackOnline };
}
