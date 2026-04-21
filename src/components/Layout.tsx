// @ts-nocheck
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, User, Settings, Info, LogOut, Menu, X, 
  ChevronRight, ArrowRight, Sparkles, Scale, MapPin, QrCode,
  HelpCircle, Ticket, Camera
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import OfflineOverlay from '@/components/OfflineOverlay';
import ReloadPrompt from '@/components/ReloadPrompt';

export default function Layout() {
  const { t } = useTranslation();
  const { profile, user, isGuest } = useAuth();
  const navigate = useNavigate();
  // ...
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-close menu on any route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      checkUnread();
      
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => checkUnread()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const checkUnread = async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      setHasUnread(count > 0);
    }
  };
  
  return (
    <div className="min-h-screen bg-bg-page text-text-main selection:bg-brand-primary/10 pb-24">
      {/* Non-blocking offline banner — always on top */}
      <OfflineOverlay />
      <ReloadPrompt />
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-brand-secondary/20 blur-[100px] rounded-full animate-blob animation-delay-2000"></div>
      </div>

      {/* Scrim */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-bg-end/70 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <header className="bg-white/80 backdrop-blur-lg border-b border-black/5 flex items-center justify-between px-6 py-4 sticky top-0 z-[70]">
        <div onClick={() => navigate('/')} className="cursor-pointer flex flex-col items-start gap-0.5 group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-brand-primary/10 group-hover:scale-110 transition-transform duration-300">
              <img src="pwa-192x192.png" alt="Nabbu Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-black text-text-main tracking-tight">Nabbu</h1>
          </div>
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider ml-10">{t('login.subtitle')}</p>
        </div>
        
        <div className="relative">
          {(!user && isGuest) ? (
            <button 
              onClick={() => navigate('/login')}
              className="bg-brand-primary text-white text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-md shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {t('common.signIn')}
            </button>
          ) : (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative w-11 h-11 rounded-[16px] overflow-hidden border border-black/10 shadow-premium hover:shadow-xl hover:rotate-3 hover:scale-110 transition-all active:scale-95 group z-[70] bg-white flex-shrink-0"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-primary/5 text-brand-primary text-xs font-bold">
                  {profile?.full_name?.substring(0, 1) || 'U'}
                </div>
              )}
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse shadow-sm z-10"></span>
              )}
            </button>
          )}

          {isMenuOpen && (
            <div className="absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-xl rounded-[32px] border border-black/5 shadow-2xl z-[70] p-2 overflow-hidden">
              <div className="px-4 py-4 border-b border-black/[0.05] mb-2">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-0.5">{t('layout.welcomeBack')}</p>
                <p className="text-sm font-black text-text-main truncate">{profile?.full_name || 'Redeemer'}</p>
              </div>
              
              <div className="space-y-1 p-1">
                <button 
                  onClick={() => navigate('/notifications')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-black/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary/60 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                      <Bell size={18} />
                    </div>
                    <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{t('layout.activity')}</span>
                  </div>
                  {hasUnread && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white overflow-hidden shadow-sm">•</span>
                  )}
                </button>

                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary/60 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{t('layout.myProfile')}</span>
                </button>

                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary/60 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                    <Settings size={18} />
                  </div>
                  <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{t('layout.settings')}</span>
                </button>

                <button 
                  onClick={() => navigate('/support')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary/60 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                    <HelpCircle size={18} />
                  </div>
                  <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{t('layout.supportFaq')}</span>
                </button>

                <button 
                  onClick={() => navigate('/about')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                    <Info size={18} />
                  </div>
                  <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{t('layout.aboutApp')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-lg mx-auto p-4 transition-all duration-300">
        <Outlet />
      </main>

      {/* Primary Bottom Navigation */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none">
        <nav className="flex items-center gap-1 bg-white border border-black/5 px-2 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-text-muted hover:text-text-main hover:bg-black/5'
            }`}
          >
            <MapPin size={20} />
            <span className="text-xs font-bold">{t('nav.explore')}</span>
          </NavLink>
          
          <NavLink 
            to="/coupons" 
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-text-muted hover:text-text-main hover:bg-black/5'
            }`}
          >
            <Ticket size={20} />
            <span className="text-xs font-bold">{t('nav.coupons')}</span>
          </NavLink>
 
          <NavLink 
            to="/scanner" 
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-text-muted hover:text-text-main hover:bg-black/5'
            }`}
          >
            <QrCode size={20} />
            <span className="text-xs font-bold">{t('nav.scanner')}</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

