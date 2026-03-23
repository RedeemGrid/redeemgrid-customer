import { useState, useEffect, useCallback } from 'react';

const LOCATION_ASKED_KEY = 'rg_location_asked';

/**
 * Smart geolocation hook using Permissions API.
 *
 * permissionStatus values:
 * - 'idle'     : Not yet checked
 * - 'checking' : Querying Permissions API (no browser prompt yet)
 * - 'prompt'   : First-time user — show in-app rationale before asking
 * - 'loading'  : Actively waiting for coords
 * - 'ready'    : Coords received
 * - 'denied'   : User blocked location
 * - 'error'    : Browser doesn't support geolocation
 */
export const useGeolocation = (options = {}) => {
  const [state, setState] = useState({
    permissionStatus: 'idle',
    coords: null,
    error: null,
  });

  const doRequestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          permissionStatus: 'ready',
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
        });
      },
      (err) => {
        const isDenied = err.code === 1; // PERMISSION_DENIED
        setState({
          permissionStatus: isDenied ? 'denied' : 'error',
          coords: null,
          error: err.message,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000, ...options }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, permissionStatus: 'error', error: 'Geolocation not supported' }));
      return;
    }

    setState(s => ({ ...s, permissionStatus: 'checking' }));

    const hasSeenRationale = localStorage.getItem(LOCATION_ASKED_KEY) === 'true';

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        const handleState = (state) => {
          if (state === 'granted') {
            setState(s => ({ ...s, permissionStatus: 'loading' }));
            doRequestLocation();
          } else if (state === 'denied') {
            setState(s => ({ ...s, permissionStatus: 'denied', error: 'Location access was denied.' }));
          } else {
            // 'prompt': check if user has seen our rationale before
            if (hasSeenRationale) {
              // They've tapped "Allow" on our screen before — skip rationale, go straight to browser request
              setState(s => ({ ...s, permissionStatus: 'loading' }));
              doRequestLocation();
            } else {
              setState(s => ({ ...s, permissionStatus: 'prompt' }));
            }
          }
        };

        handleState(result.state);

        result.onchange = () => handleState(result.state);
      });
    } else {
      // Permissions API not supported — fall back to direct request
      setState(s => ({ ...s, permissionStatus: 'loading' }));
      doRequestLocation();
    }
  }, [doRequestLocation]);

  // Called when user taps CTa on our rationale screen — sets the localStorage flag
  const requestLocation = useCallback(() => {
    localStorage.setItem(LOCATION_ASKED_KEY, 'true');
    setState(s => ({ ...s, permissionStatus: 'loading' }));
    doRequestLocation();
  }, [doRequestLocation]);

  return { ...state, requestLocation };
};
