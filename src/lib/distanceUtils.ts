/**
 * Utility to format and convert distances based on user preferences.
 */
export const formatDistance = (
  meters: number, 
  unit: 'km' | 'mi', 
  t: (key: string, options?: any) => string
): string => {
  if (unit === 'mi') {
    // 1 Mile = 1609.34 Meters
    const miles = meters / 1609.34;
    return t('settings.radiusValue', { 
      val: miles < 0.1 ? '0.1' : (Math.round(miles * 10) / 10).toFixed(1), 
      unit: t('settings.miles') 
    });
  } else {
    // 1 Kilometer = 1000 Meters
    const km = meters / 1000;
    return t('settings.radiusValue', { 
      val: km < 0.1 ? '0.1' : (Math.round(km * 10) / 10).toFixed(1), 
      unit: t('settings.kilometers') 
    });
  }
};
