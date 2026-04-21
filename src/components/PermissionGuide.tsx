import { useState, useEffect } from 'react';
import { 
  Camera, MapPin, Bell, 
  Globe, AlertCircle, HelpCircle, ChevronRight, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PermissionGuideProps {
  type: 'camera' | 'location' | 'notifications';
  onAlreadyFixed?: () => void;
}

export default function PermissionGuide({ type, onAlreadyFixed }: PermissionGuideProps) {
  const { t } = useTranslation();
  const [isStandalone, setIsStandalone] = useState(false);
  const [os, setOS] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detect Standalone mode
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      setOS('ios');
    } else if (ua.includes('android')) {
      setOS('android');
    }
  }, []);

  const Icon = type === 'camera' ? Camera : type === 'location' ? MapPin : Bell;

  return (
    <div className="bg-white rounded-[40px] border border-black/5 shadow-premium overflow-hidden p-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-status-error-bg rounded-[32px] flex items-center justify-center text-status-error mb-6 shadow-sm">
          <Icon size={36} />
        </div>
        
        <h3 className="text-2xl font-black text-text-main mb-3 tracking-tight leading-tight uppercase">
          {t(`permissions.${type}.title`)}
        </h3>
        
        <p className="text-text-muted text-sm font-medium mb-10 leading-relaxed max-w-xs">
          {t(`permissions.${type}.desc`)}
        </p>

        <div className="w-full space-y-4 mb-10">
          <div className="bg-bg-page rounded-[32px] p-8 text-left border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <HelpCircle size={64} />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-6 flex items-center gap-2">
               <AlertCircle size={14} />
               {isStandalone ? t('permissions.guide.stepStandaloneIntro') : t('permissions.guide.stepBrowserIntro')}
            </p>

            <div className="space-y-6">
              {isStandalone ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex-shrink-0 flex items-center justify-center text-xs font-black">1</div>
                    <p className="text-sm font-bold text-text-main leading-snug">
                      {os === 'ios' ? t('permissions.guide.stepIosApp') : t('permissions.guide.stepAndroidApp')}
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-black/5">
                    <button 
                      onClick={() => window.open(window.location.origin + import.meta.env.BASE_URL + 'permissions-bridge', '_blank')}
                      className="w-full bg-brand-primary text-white p-6 rounded-[24px] flex items-center justify-between shadow-lg shadow-brand-primary/20 hover:opacity-90 active:scale-95 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                           <ExternalLink size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-0.5">
                             {t('permissions.guide.manage')}
                          </span>
                          <span className="text-sm font-black uppercase tracking-tight">
                            {t('permissions.guide.openInBrowser')}
                          </span>
                        </div>
                      </div>
                      <Globe size={20} className="opacity-50" />
                    </button>
                    <p className="mt-4 text-[9px] text-center font-bold text-text-muted/40 uppercase tracking-widest leading-relaxed px-4">
                       {t('permissions.bridge.browserOnly')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex-shrink-0 flex items-center justify-center text-xs font-black">1</div>
                    <p className="text-sm font-bold text-text-main leading-snug">
                      {t('permissions.guide.stepBrowserLock')}
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex-shrink-0 flex items-center justify-center text-xs font-black">2</div>
                    <p className="text-sm font-bold text-text-main leading-snug">
                      {t('permissions.guide.stepBrowserSettings', { type: t(`permissions.${type}.title`) })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-brand-primary text-white font-black py-4 rounded-full shadow-lg shadow-brand-primary/20 hover:opacity-90 active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {t('offline.retry')}
          </button>
          
          <button 
            onClick={onAlreadyFixed}
            className="bg-white border border-black/10 text-text-main font-black py-4 rounded-full hover:bg-neutral-50 active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
          >
            {t('permissions.guide.alreadyFixed')}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
