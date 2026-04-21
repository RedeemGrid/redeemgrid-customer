import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type DistanceUnit = 'km' | 'mi';

interface PreferencesContextType {
  searchRadius: number;
  setSearchRadius: (val: number) => void;
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
  radiusInMeters: number;
}

const STORAGE_KEY = 'rg_user_preferences';
const DEFAULT_RADIUS = 50;
const DEFAULT_UNIT: DistanceUnit = 'km';

const PreferencesContext = createContext<PreferencesContextType>({} as PreferencesContextType);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [searchRadius, setSearchRadius] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.searchRadius ?? DEFAULT_RADIUS;
      } catch {
        return DEFAULT_RADIUS;
      }
    }
    return DEFAULT_RADIUS;
  });

  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.distanceUnit ?? DEFAULT_UNIT;
      } catch {
        return DEFAULT_UNIT;
      }
    }
    return DEFAULT_UNIT;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ searchRadius, distanceUnit }));
  }, [searchRadius, distanceUnit]);

  // Derived value for API calls
  const radiusInMeters = distanceUnit === 'mi' 
    ? Math.round(searchRadius * 1609.34)
    : searchRadius * 1000;

  const value: PreferencesContextType = {
    searchRadius,
    setSearchRadius,
    distanceUnit,
    setDistanceUnit,
    radiusInMeters
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
