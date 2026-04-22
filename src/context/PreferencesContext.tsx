import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type DistanceUnit = 'km' | 'mi';

interface PreferencesContextType {
  // Discovery
  searchRadius: number;
  setSearchRadius: (val: number) => void;
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
  radiusInMeters: number;
  
  // Notifications
  notifExpiryEnabled: boolean;
  setNotifExpiryEnabled: (val: boolean) => void;
  notifExpiryHours: number;
  setNotifExpiryHours: (val: number) => void;
  notifFavOffersEnabled: boolean;
  setNotifFavOffersEnabled: (val: boolean) => void;
  notifProximityAlertsEnabled: boolean;
  setNotifProximityAlertsEnabled: (val: boolean) => void;
}

const STORAGE_KEY = 'rg_user_preferences';
const DEFAULT_RADIUS = 50;
const DEFAULT_UNIT: DistanceUnit = 'km';

const PreferencesContext = createContext<PreferencesContextType>({} as PreferencesContextType);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  
  // Local state initialized from localStorage
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_RADIUS);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(DEFAULT_UNIT);
  const [notifExpiryEnabled, setNotifExpiryEnabled] = useState(true);
  const [notifExpiryHours, setNotifExpiryHours] = useState(24);
  const [notifFavOffersEnabled, setNotifFavOffersEnabled] = useState(true);
  const [notifProximityAlertsEnabled, setNotifProximityAlertsEnabled] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.searchRadius) setSearchRadius(p.searchRadius);
        if (p.distanceUnit) setDistanceUnit(p.distanceUnit);
        if (p.notifExpiryEnabled !== undefined) setNotifExpiryEnabled(p.notifExpiryEnabled);
        if (p.notifExpiryHours) setNotifExpiryHours(p.notifExpiryHours);
        if (p.notifFavOffersEnabled !== undefined) setNotifFavOffersEnabled(p.notifFavOffersEnabled);
        if (p.notifProximityAlertsEnabled !== undefined) setNotifProximityAlertsEnabled(p.notifProximityAlertsEnabled);
      } catch (e) {
        console.error('Error parsing preferences', e);
      }
    }
  }, []);

  // Sync with Profile if logged in
  useEffect(() => {
    if (profile) {
      if (profile.notif_expiry_enabled !== undefined) setNotifExpiryEnabled(profile.notif_expiry_enabled);
      if (profile.notif_expiry_hours) setNotifExpiryHours(profile.notif_expiry_hours);
      if (profile.notif_fav_offers_enabled !== undefined) setNotifFavOffersEnabled(profile.notif_fav_offers_enabled);
      if (profile.notif_proximity_alerts_enabled !== undefined) setNotifProximityAlertsEnabled(profile.notif_proximity_alerts_enabled);
    }
  }, [profile]);

  // Persist to localStorage & Supabase
  useEffect(() => {
    const prefs = { 
      searchRadius, 
      distanceUnit, 
      notifExpiryEnabled, 
      notifExpiryHours, 
      notifFavOffersEnabled, 
      notifProximityAlertsEnabled 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

    // Update Supabase if authenticated
    if (user) {
      const updateDb = async () => {
        await supabase.from('profiles').update({
          notif_expiry_enabled: notifExpiryEnabled,
          notif_expiry_hours: notifExpiryHours,
          notif_fav_offers_enabled: notifFavOffersEnabled,
          notif_proximity_alerts_enabled: notifProximityAlertsEnabled
        }).eq('id', user.id);
      };
      updateDb();
    }
  }, [searchRadius, distanceUnit, notifExpiryEnabled, notifExpiryHours, notifFavOffersEnabled, notifProximityAlertsEnabled, user]);

  const radiusInMeters = distanceUnit === 'mi' 
    ? Math.round(searchRadius * 1609.34)
    : searchRadius * 1000;

  const value: PreferencesContextType = {
    searchRadius,
    setSearchRadius,
    distanceUnit,
    setDistanceUnit,
    radiusInMeters,
    notifExpiryEnabled,
    setNotifExpiryEnabled,
    notifExpiryHours,
    setNotifExpiryHours,
    notifFavOffersEnabled,
    setNotifFavOffersEnabled,
    notifProximityAlertsEnabled,
    setNotifProximityAlertsEnabled
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
