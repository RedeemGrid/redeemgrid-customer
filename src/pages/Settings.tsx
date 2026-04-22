import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, HelpCircle, Globe, Map, Ruler, MapPin, 
  ShieldCheck, XCircle, CheckCircle2, ChevronDown, 
  Bell, Clock, AlertTriangle, Star, Navigation2, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { availableLanguages } from '../i18n';
import { usePreferences } from '@/context/PreferencesContext';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import PermissionGuide from '@/components/PermissionGuide';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { 
    searchRadius, setSearchRadius, 
    distanceUnit, setDistanceUnit,
    notifExpiryEnabled, setNotifExpiryEnabled,
    notifExpiryHours, setNotifExpiryHours,
    notifFavOffersEnabled, setNotifFavOffersEnabled,
    notifProximityAlertsEnabled, setNotifProximityAlertsEnabled
  } = usePreferences();
  
  const cameraStatus = useCameraPermission();
  const { permissionStatus: geoStatus } = useGeolocation();
  const { status: notifStatus, request: requestNotif } = useNotificationPermission();

  const [activeAccordion, setActiveAccordion] = useState<string | null>('language');
  const [activeGuide, setActiveGuide] = useState<'camera' | 'location' | 'notifications' | null>(null);

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const currentLangName = availableLanguages.find(l => l.code === (i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'))?.name || 'English';

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('settings.title')}</h2>
      </header>

      <div className="space-y-4">
        {/* 1. Language & Region */}
        <AccordionItem
          id="language"
          title={t('settings.categories.language')}
          summary={`${currentLangName} • ${distanceUnit.toUpperCase()}`}
          icon={<Globe size={20} />}
          isOpen={activeAccordion === 'language'}
          onToggle={() => toggleAccordion('language')}
        >
          <div className="space-y-6 pt-2">
             {/* Language Selector */}
             <div className="relative bg-neutral-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group overflow-hidden hover:bg-white transition-all">
                <select 
                  value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'}
                  onChange={handleLanguageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base z-10"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-sm border border-black/5">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">{t('settings.language')}</p>
                    <p className="text-sm font-bold text-text-main">{currentLangName}</p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-text-muted/30 -rotate-90" />
             </div>

             {/* Distance Unit */}
             <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-secondary shadow-sm border border-black/5">
                    <Ruler size={20} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t('settings.distanceUnit')}</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-black/5 shadow-inner">
                  <button
                    onClick={() => setDistanceUnit('km')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      distanceUnit === 'km' ? 'bg-brand-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {t('settings.kilometers')}
                  </button>
                  <button
                    onClick={() => setDistanceUnit('mi')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      distanceUnit === 'mi' ? 'bg-brand-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {t('settings.miles')}
                  </button>
                </div>
             </div>
          </div>
        </AccordionItem>

        {/* 2. Discovery Preferences */}
        <AccordionItem
          id="discovery"
          title={t('settings.categories.discovery')}
          summary={`${searchRadius} ${distanceUnit.toUpperCase()}`}
          icon={<MapPin size={20} />}
          isOpen={activeAccordion === 'discovery'}
          onToggle={() => toggleAccordion('discovery')}
        >
          <div className="bg-neutral-50 p-8 rounded-[32px] border border-black/5 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-primary border border-black/5 shadow-sm">
                <Map size={20} />
              </div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest text-text-muted leading-tight mb-1">{t('settings.searchRadius')}</p>
                <p className="text-text-main text-sm font-black">
                  {t('settings.radiusValue', { val: searchRadius, unit: t(`settings.${distanceUnit === 'km' ? 'kilometers' : 'miles'}`) })}
                </p>
              </div>
            </div>

            <div className="relative pt-10 pb-8 px-2">
              <div className="absolute inset-x-2 top-[calc(40px+12px)] h-1.5 bg-white/50 rounded-full border border-black/5"></div>
              <div 
                className="absolute left-2 top-[calc(40px+12px)] h-1.5 bg-brand-primary rounded-l-full transition-all duration-300 pointer-events-none"
                style={{ width: `calc(${((searchRadius - 5) / 95) * 100}% - 8px)` }}
              ></div>
              <div 
                className="absolute top-0 -translate-x-1/2 transition-all duration-300 pointer-events-none flex flex-col items-center"
                style={{ left: `calc(${((searchRadius - 5) / 95) * 100}% + 8px)` }}
              >
                <div className="relative">
                  <MapPin size={32} className="text-brand-primary drop-shadow-xl" fill="currentColor" />
                  <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-inner"></div>
                </div>
              </div>
              <input
                type="range" min="5" max="100" step="5"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="absolute inset-x-0 top-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="flex justify-between mt-8 text-[9px] font-black text-text-muted/40 uppercase tracking-widest">
                <span>5 {distanceUnit.toUpperCase()}</span>
                <span>100 {distanceUnit.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 3. Notifications */}
        <AccordionItem
          id="notifications"
          title={t('settings.categories.notifications')}
          summary={notifExpiryEnabled ? t('common.showLess') : t('common.readMore')} // Simple summary
          icon={<Bell size={20} />}
          isOpen={activeAccordion === 'notifications'}
          onToggle={() => toggleAccordion('notifications')}
        >
          <div className="space-y-4">
             {/* Expiry Warning */}
             <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-status-warning shadow-sm border border-black/5">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-main">{t('settings.expiryWarning')}</p>
                      <p className="text-[10px] text-text-muted font-bold">{t('settings.expiryWarningDesc')}</p>
                    </div>
                  </div>
                  <ToggleButton active={notifExpiryEnabled} onClick={() => setNotifExpiryEnabled(!notifExpiryEnabled)} />
                </div>

                {notifExpiryEnabled && (
                  <div className="pt-4 border-t border-black/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-6">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t('settings.warningTime')}</p>
                       <span className="bg-white px-3 py-1.5 rounded-xl border border-black/5 text-[10px] font-black text-brand-primary shadow-sm">
                         {t('settings.warningTimeValue', { val: notifExpiryHours })}
                       </span>
                    </div>
                    <div className="relative px-2 py-4">
                      <div className="h-1.5 bg-white rounded-full border border-black/5"></div>
                      <div 
                        className="absolute left-2 top-4 h-1.5 bg-brand-primary rounded-l-full transition-all"
                        style={{ width: `calc(${((notifExpiryHours - 1) / 47) * 100}% - 4px)` }}
                      ></div>
                      <input 
                        type="range" min="1" max="48" step="1"
                        value={notifExpiryHours}
                        onChange={(e) => setNotifExpiryHours(parseInt(e.target.value))}
                        className="absolute inset-x-0 top-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      <div className="flex justify-between mt-4 text-[8px] font-black text-text-muted/30 uppercase tracking-widest">
                        <span>1H</span>
                        <span>24H</span>
                        <span>48H</span>
                      </div>
                    </div>
                  </div>
                )}
             </div>

             {/* Favorite Offers (Placeholder logic) */}
             <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group opacity-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-sm border border-black/5">
                    <Star size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-text-main">{t('settings.favOffers')}</p>
                      <span className="text-[8px] bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-md font-black uppercase">{t('settings.comingSoon')}</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold">{t('settings.favOffersDesc')}</p>
                  </div>
                </div>
                <ToggleButton active={notifFavOffersEnabled} onClick={() => setNotifFavOffersEnabled(!notifFavOffersEnabled)} />
             </div>

             {/* Proximity Alerts (Placeholder logic) */}
             <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group opacity-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-secondary shadow-sm border border-black/5">
                    <Navigation2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-text-main">{t('settings.proximityAlerts')}</p>
                      <span className="text-[8px] bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-md font-black uppercase">{t('settings.comingSoon')}</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold">{t('settings.proximityAlertsDesc')}</p>
                  </div>
                </div>
                <ToggleButton active={notifProximityAlertsEnabled} onClick={() => setNotifProximityAlertsEnabled(!notifProximityAlertsEnabled)} />
             </div>
          </div>
        </AccordionItem>

        {/* 4. Privacy & Permissions */}
        <AccordionItem
          id="security"
          title={t('settings.categories.security')}
          summary={t('permissions.guide.manage')}
          icon={<ShieldCheck size={20} />}
          isOpen={activeAccordion === 'security'}
          onToggle={() => toggleAccordion('security')}
        >
          <div className="space-y-3 pt-2">
            <PermissionRow 
              label={t('permissions.location.title')}
              status={geoStatus === 'ready' || geoStatus === 'loading' ? 'granted' : geoStatus === 'denied' ? 'denied' : 'prompt'}
              onFix={() => setActiveGuide('location')}
              t={t}
            />
            <PermissionRow 
              label={t('permissions.camera.title')}
              status={cameraStatus as any}
              onFix={() => setActiveGuide('camera')}
              t={t}
            />
            <PermissionRow 
              label={t('permissions.notifications.title')}
              status={notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'prompt'}
              onFix={() => notifStatus === 'default' ? requestNotif() : setActiveGuide('notifications')}
              t={t}
            />
          </div>
        </AccordionItem>

        {/* 5. Support & Help */}
        <AccordionItem
          id="support"
          title={t('settings.categories.support')}
          summary={t('settings.faqContact')}
          icon={<HelpCircle size={20} />}
          isOpen={activeAccordion === 'support'}
          onToggle={() => toggleAccordion('support')}
        >
          <div className="space-y-4 pt-2">
            <button 
              onClick={() => navigate('/support')}
              className="w-full bg-neutral-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group hover:bg-white transition-all shadow-sm"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-primary border border-black/5 shadow-sm">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="font-black text-sm text-text-main">{t('layout.supportFaq')}</p>
                  <p className="text-text-muted text-[10px] font-bold mt-0.5">{t('settings.faqContact')}</p>
                </div>
              </div>
              <ChevronLeft size={18} className="rotate-180 text-text-muted/30 group-hover:text-brand-primary transition-colors" />
            </button>
            
            <button 
              onClick={() => navigate('/terms')}
              className="w-full bg-neutral-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group hover:bg-white transition-all shadow-sm"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-text-muted border border-black/5 shadow-sm">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-black text-sm text-text-main">{t('terms.title')}</p>
                  <p className="text-text-muted text-[10px] font-bold mt-0.5">Nabbu Policy</p>
                </div>
              </div>
              <ChevronLeft size={18} className="rotate-180 text-text-muted/30 transition-colors" />
            </button>
          </div>
        </AccordionItem>
      </div>

      {/* Permission Guide Overlay */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md" onClick={() => setActiveGuide(null)}></div>
          <div className="relative w-full max-w-lg">
            <PermissionGuide 
              type={activeGuide} 
              onAlreadyFixed={() => {
                setActiveGuide(null);
                window.location.reload();
              }} 
            />
            <button 
              onClick={() => setActiveGuide(null)}
              className="absolute -top-12 right-0 text-white hover:text-brand-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
            >
              {t('profile.cancel')} <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionItem({ id, title, summary, icon, isOpen, onToggle, children }: { id: string, title: string, summary: string, icon: React.ReactNode, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-[40px] border transition-all duration-500 overflow-hidden ${isOpen ? 'border-brand-primary/20 shadow-premium' : 'border-black/5 shadow-sm'}`}>
      <button 
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
            isOpen ? 'bg-brand-primary text-white border-brand-primary/20 shadow-lg scale-110' : 'bg-neutral-50 text-text-muted border-black/5'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-main'}`}>{title}</h3>
            {!isOpen && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted/60 mt-1 animate-in fade-in">{summary}</p>}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-black/5 transition-transform duration-500 ${isOpen ? 'rotate-180 bg-brand-primary/5 text-brand-primary' : 'text-text-muted/30 group-hover:bg-white group-hover:text-text-main'}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      
      {isOpen && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleButton({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-brand-primary' : 'bg-neutral-200'}`}
    >
      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
  );
}

function PermissionRow({ label, status, onFix, t }: { label: string, status: 'granted' | 'denied' | 'prompt' | 'unknown', onFix: () => void, t: any }) {
  const isGranted = status === 'granted';
  const isDenied = status === 'denied';

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-3xl border border-black/5 hover:bg-white hover:border-black/10 transition-all">
      <div className="flex items-center gap-3">
        {isGranted ? (
          <CheckCircle2 size={16} className="text-brand-secondary" />
        ) : isDenied ? (
          <XCircle size={16} className="text-status-error" />
        ) : (
          <HelpCircle size={16} className="text-text-muted/40" />
        )}
        <span className="text-xs font-bold text-text-muted">{label}</span>
      </div>
      
      <button 
        onClick={onFix}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          isGranted 
            ? 'text-brand-secondary/40 pointer-events-none' 
            : isDenied 
              ? 'bg-status-error text-white shadow-lg shadow-status-error/10' 
              : 'bg-white text-brand-primary border border-black/5 shadow-sm hover:shadow-md'
        }`}
      >
        {isGranted ? t('permissions.guide.statusGranted') : isDenied ? t('permissions.guide.manage') : t('permissions.guide.statusPrompt')}
      </button>
    </div>
  );
}

