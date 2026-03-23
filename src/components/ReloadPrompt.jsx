import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-[80] animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-md mx-auto bg-bg-end/95 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-brand-primary/20 blur-2xl rounded-full"></div>

        <div className="relative flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-brand-primary" />
            <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">
              {offlineReady ? t('update.readyTitle') : t('update.newTitle')}
            </h4>
          </div>
          <p className="text-xs text-white/50 font-bold leading-tight">
            {offlineReady 
              ? t('update.readyDesc') 
              : t('update.newDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-brand-primary hover:bg-brand-primary/80 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              {t('update.btn')}
            </button>
          )}
          <button
            onClick={close}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
