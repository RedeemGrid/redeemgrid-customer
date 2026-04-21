import { useState, useEffect, useCallback, useRef } from 'react';

const LOCATION_ASKED_KEY = 'rg_location_asked';

export type PermissionStatus = 'idle' | 'checking' | 'prompt' | 'loading' | 'ready' | 'denied' | 'error';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  permissionStatus: PermissionStatus;
  coords: Coordinates | null;
  error: string | null;
}

export const useGeolocation = (options: PositionOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    permissionStatus: 'idle',
    coords: null,
    error: null,
  });

  // Use a ref for options to avoid triggering re-renders/re-callbacks if the literal changes
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const doRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, permissionStatus: 'error', error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(s => {
          // Optimize: avoid re-triggering if coordinates haven't changed
          if (s.coords?.latitude === position.coords.latitude && 
              s.coords?.longitude === position.coords.longitude && 
              s.permissionStatus === 'ready') {
            return s;
          }
          return {
            permissionStatus: 'ready',
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            error: null,
          };
        });
      },
      (err) => {
        const isDenied = err.code === 1; // PERMISSION_DENIED
        setState(s => ({
          ...s,
          permissionStatus: isDenied ? 'denied' : 'error',
          coords: null,
          error: err.message,
        }));
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000, ...optionsRef.current }
    );
  }, []);

  useEffect(() => {
    setState(s => ({ ...s, permissionStatus: 'checking' }));

    const hasSeenRationale = localStorage.getItem(LOCATION_ASKED_KEY) === 'true';

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        const handlePermissionChange = (status: string) => {
          if (status === 'granted') {
            setState(s => ({ ...s, permissionStatus: 'loading' }));
            doRequestLocation();
          } else if (status === 'denied') {
            setState(s => ({ ...s, permissionStatus: 'denied', error: 'Location access was denied.' }));
          } else {
            if (hasSeenRationale) {
              setState(s => ({ ...s, permissionStatus: 'loading' }));
              doRequestLocation();
            } else {
              setState(s => ({ ...s, permissionStatus: 'prompt' }));
            }
          }
        };

        handlePermissionChange(result.state);
        result.onchange = () => handlePermissionChange(result.state);
      }).catch(() => {
        // Fallback for query failure
        setState(s => ({ ...s, permissionStatus: 'loading' }));
        doRequestLocation();
      });
    } else {
      setState(s => ({ ...s, permissionStatus: 'loading' }));
      doRequestLocation();
    }
  }, [doRequestLocation]);

  const requestLocation = useCallback(() => {
    localStorage.setItem(LOCATION_ASKED_KEY, 'true');
    setState(s => ({ ...s, permissionStatus: 'loading' }));
    doRequestLocation();
  }, [doRequestLocation]);

  return { ...state, requestLocation };
};
