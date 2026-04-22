import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from 'react-i18next';

export function useNotificationWorker() {
  const { user } = useAuth();
  const { notifExpiryEnabled, notifExpiryHours } = usePreferences();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !notifExpiryEnabled) return;

    const checkExpiringCoupons = async () => {
      try {
        // 1. Fetch active coupons with their deal data
        const { data: coupons, error } = await supabase
          .from('coupons')
          .select(`
            id,
            last_expiry_notified_at,
            deals (
              title,
              end_date,
              tenants (name)
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (error) throw error;
        if (!coupons || coupons.length === 0) return;

        const now = new Date();
        const warningMs = notifExpiryHours * 60 * 60 * 1000;

        for (const coupon of coupons) {
          let deal = (coupon as any).deals;
          // Handle case where deals might be returned as an array
          if (Array.isArray(deal)) deal = deal[0];

          if (!deal || !deal.end_date) continue;

          const endDate = new Date(deal.end_date);
          const diffMs = endDate.getTime() - now.getTime();
          
          // If expiring within the window AND not already notified
          if (diffMs > 0 && diffMs <= warningMs && !coupon.last_expiry_notified_at) {
            
            // 2. Create notification record
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                title: t('settings.expiryWarning'),
                message: `${deal.tenants?.name || 'Comercio'}: ${deal.title} ${t('home.expires')} ${endDate.toLocaleDateString()}`,
                type: 'expiration',
                link: `/coupons?id=${coupon.id}`
              });

            if (notifError) continue;
            
            // 3. Update coupon so we don't notify again
            await supabase
              .from('coupons')
              .update({ last_expiry_notified_at: now.toISOString() })
              .eq('id', coupon.id);
          }
        }
      } catch (err) {
        console.error('Notification worker error:', err);
      }
    };

    // Run on mount (or when preferences change)
    checkExpiringCoupons();

    // Optional: Set up an interval if the app stays open long
    const interval = setInterval(checkExpiringCoupons, 1000 * 60 * 30); // Every 30 mins
    return () => clearInterval(interval);

  }, [user, notifExpiryEnabled, notifExpiryHours, t]);
}
