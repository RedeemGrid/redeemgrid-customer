import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, ChevronLeft, Trash2, CheckCircle, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications.some(n => !n.is_read)) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 animate-pulse">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight">{t('notifications.title')}</h2>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-4 py-2 rounded-xl hover:bg-brand-primary/10 transition-all border border-brand-primary/10"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </header>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <div className="bg-white border border-dashed border-black/5 rounded-[48px] py-24 text-center px-8 shadow-sm">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-black/5">
              <Bell size={40} className="text-neutral-200" />
            </div>
            <h3 className="text-2xl font-black text-text-main mb-3">{t('notifications.emptyTitle')}</h3>
            <p className="text-text-muted text-sm max-w-xs mx-auto mb-10 leading-relaxed font-medium">
              {t('notifications.emptyDesc')}
            </p>
            <Link 
              to="/" 
              className="inline-block bg-brand-secondary text-white text-[11px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-full hover:bg-brand-primary transition-all shadow-lg shadow-brand-secondary/20 active:scale-95"
            >
              {t('notifications.backToExplore')}
            </Link>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`group relative overflow-hidden p-6 rounded-[32px] border transition-all flex gap-5 items-start cursor-pointer shadow-sm ${
                n.is_read 
                ? 'bg-neutral-50 border-black/5 opacity-60 grayscale-[0.3]' 
                : 'bg-white border-black/5'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                n.type === 'expiration' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10'
              }`}>
                {n.type === 'expiration' ? <Clock size={24} /> : <Info size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-base font-black truncate pr-6 ${n.is_read ? 'text-text-muted' : 'text-text-main'}`}>
                    {n.title}
                  </h4>
                  {!n.is_read && (
                    <span className="relative flex h-3 w-3 mt-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary/40 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted leading-relaxed mb-4 font-medium">{n.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted/50 font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={12} className={n.is_read ? 'text-brand-secondary' : 'text-neutral-200'} />
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="p-2 text-text-muted/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
