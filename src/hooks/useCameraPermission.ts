import { useState, useEffect } from 'react';

export type ExtendedPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export const useCameraPermission = () => {
  const [status, setStatus] = useState<ExtendedPermissionStatus>('unknown');

  useEffect(() => {
    // Check if permissions API is supported
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback for browsers that don't support query (like some Safari versions)
      setStatus('prompt'); 
      return;
    }

    let isMounted = true;

    navigator.permissions.query({ name: 'camera' as any })
      .then((result) => {
        if (!isMounted) return;
        
        setStatus(result.state as ExtendedPermissionStatus);
        
        result.onchange = () => {
          if (isMounted) {
            setStatus(result.state as ExtendedPermissionStatus);
          }
        };
      })
      .catch(() => {
        if (isMounted) setStatus('prompt');
      });

    return () => { isMounted = false; };
  }, []);

  return status;
};
