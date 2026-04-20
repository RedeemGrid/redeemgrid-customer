import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function OfflineOverlay() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // ...
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-end/80 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-white/10 rounded-[48px] p-10 border border-white/20 shadow-2xl relative overflow-hidden group text-center">
        {/* Animated Background Decor */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full animate-pulse animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10 mx-auto mb-8 border border-red-500/20">
            <WifiOff size={48} strokeWidth={1.5} className="animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">{t('offline.title')}</h2>
          <p className="text-white/60 text-sm leading-relaxed font-bold mb-8">
            {t('offline.desc')}
          </p>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-brand-secondary font-black py-5 rounded-[28px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
            {t('offline.retry')}
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{t('offline.badge')}</span>
      </div>
    </div>
  );
}
