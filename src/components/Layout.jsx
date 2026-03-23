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
import OfflineOverlay from './OfflineOverlay';
import ReloadPrompt from './ReloadPrompt';

export default function Layout() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
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
    <div className="min-h-screen bg-bg-end bg-gradient-to-br from-bg-start via-bg-mid to-bg-end text-white selection:bg-brand-primary/30 pb-24">
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

      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-6 py-4 sticky top-0 z-[70]">
        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform duration-300">
            <QrCode size={22} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">RedeemGrid</h1>
        </div>
        
        <div className="relative z-[70]">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative w-11 h-11 rounded-[16px] overflow-hidden border-2 border-white/20 shadow-xl hover:border-brand-primary transition-all active:scale-95 group"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-primary/10 text-brand-primary text-xs font-bold">
                {profile?.full_name?.substring(0, 1) || 'U'}
              </div>
            )}
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white/20 animate-pulse shadow-lg shadow-red-500/50"></span>
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-4 w-64 bg-bg-end/95 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl z-[70] p-2 overflow-hidden">
              <div className="px-4 py-4 border-b border-white/[0.08] mb-2">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-0.5">{t('layout.welcomeBack')}</p>
                <p className="text-sm font-black text-white truncate">{profile?.full_name || 'Redeemer'}</p>
              </div>
              
              <div className="space-y-1 p-1">
                <button 
                  onClick={() => navigate('/notifications')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                      <Bell size={18} />
                    </div>
                    <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{t('layout.activity')}</span>
                  </div>
                  {hasUnread && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white overflow-hidden shadow-lg">•</span>
                  )}
                </button>

                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{t('layout.myProfile')}</span>
                </button>

                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                    <Settings size={18} />
                  </div>
                  <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{t('layout.settings')}</span>
                </button>

                <button 
                  onClick={() => navigate('/support')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                    <HelpCircle size={18} />
                  </div>
                  <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{t('layout.supportFaq')}</span>
                </button>

                <button 
                  onClick={() => navigate('/about')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-colors group text-left"
                >
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary/70 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                    <Info size={18} />
                  </div>
                  <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{t('layout.aboutApp')}</span>
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
        <nav className="flex items-center gap-1 bg-white/10 backdrop-blur-xl border border-white/20 px-2 py-2 rounded-2xl shadow-2xl pointer-events-auto">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-white text-brand-secondary shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin size={20} />
            <span className="text-xs font-bold">{t('nav.explore')}</span>
          </NavLink>
          
          <NavLink 
            to="/coupons" 
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-white text-brand-secondary shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Ticket size={20} />
            <span className="text-xs font-bold">{t('nav.coupons')}</span>
          </NavLink>

          <NavLink 
            to="/scanner" 
            className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-white text-brand-secondary shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'
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
