import { useState, useEffect } from 'react';

export const useNotificationPermission = () => {
  const [status, setStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const request = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    
    try {
      const result = await Notification.requestPermission();
      setStatus(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    // Poll for status changes as 'Notification.permission' doesn't have an event listener in many browsers
    const interval = setInterval(() => {
        if (Notification.permission !== status) {
            setStatus(Notification.permission);
        }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [status]);

  return { status, request };
};
