import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Globe, Map, Ruler, MapPin, ShieldCheck, XCircle, CheckCircle2, ChevronDown } from 'lucide-react';
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
  const { searchRadius, setSearchRadius, distanceUnit, setDistanceUnit } = usePreferences();
  
  const cameraStatus = useCameraPermission();
  const { permissionStatus: geoStatus } = useGeolocation();
  const { status: notifStatus, request: requestNotif } = useNotificationPermission();

  const [activeGuide, setActiveGuide] = useState<'camera' | 'location' | 'notifications' | null>(null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('settings.title')}</h2>
      </header>

      <div className="space-y-6">
        {/* Search Radius Preference */}
        <div className="bg-white border border-black/5 p-8 rounded-[40px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-primary/10 transition-colors"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
              <Map size={24} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase leading-tight text-text-main">{t('settings.searchRadius')}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">
                {t('settings.radiusValue', { val: searchRadius, unit: t(`settings.${distanceUnit === 'km' ? 'kilometers' : 'miles'}`) })}
              </p>
            </div>
          </div>

          <div className="relative pt-10 pb-8 px-2">
            {/* Custom Track Background */}
            <div className="absolute inset-x-2 top-[calc(40px+12px)] h-2 bg-neutral-100 rounded-full"></div>
            
            {/* Active Track (Highlighted) */}
            <div 
              className="absolute left-2 top-[calc(40px+12px)] h-2 bg-brand-primary rounded-l-full transition-all duration-300 pointer-events-none"
              style={{ width: `calc(${((searchRadius - 5) / 95) * 100}% - 8px)` }}
            ></div>

            {/* Custom MapPin Thumb */}
            <div 
              className="absolute top-0 -translate-x-1/2 transition-all duration-300 pointer-events-none flex flex-col items-center"
              style={{ left: `calc(${((searchRadius - 5) / 95) * 100}% + 8px)` }}
            >
              <div className="relative">
                <MapPin size={36} className="text-brand-primary drop-shadow-lg" fill="currentColor" />
                {/* The white dot in the center of the pin */}
                <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-inner"></div>
              </div>
            </div>

            {/* Hidden native input for events */}
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="absolute inset-x-0 top-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            <div className="flex justify-between mt-8 text-[10px] font-black text-text-muted/60 uppercase tracking-tighter">
              <span>5 {distanceUnit.toUpperCase()}</span>
              <span>50 {distanceUnit.toUpperCase()}</span>
              <span>100 {distanceUnit.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Distance Unit Toggle */}
        <div className="bg-white border border-black/5 p-8 rounded-[40px] shadow-sm group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary border border-brand-secondary/20">
              <Ruler size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase leading-tight text-text-main">{t('settings.distanceUnit')}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">{t('settings.preferences')}</p>
            </div>
          </div>

          <div className="flex bg-neutral-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setDistanceUnit('km')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                distanceUnit === 'km' 
                  ? 'bg-white text-brand-primary shadow-sm' 
                  : 'text-text-muted/60 hover:text-text-main'
              }`}
            >
              {t('settings.kilometers')}
            </button>
            <button
              onClick={() => setDistanceUnit('mi')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                distanceUnit === 'mi' 
                  ? 'bg-white text-brand-primary shadow-sm' 
                  : 'text-text-muted/60 hover:text-text-main'
              }`}
            >
              {t('settings.miles')}
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="relative bg-white border border-black/5 p-8 rounded-[40px] flex items-center justify-between group overflow-hidden hover:bg-neutral-50 transition-colors shadow-sm">
          <select 
            value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'}
            onChange={handleLanguageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base z-10"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-white text-text-main">
                {lang.name}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-4 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary border border-brand-secondary/20">
              <Globe size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase leading-tight text-text-main">{t('settings.language')}</p>
              <p className="mt-1 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                {availableLanguages.find(l => l.code === (i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'))?.name || 'English'}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center pointer-events-none border border-black/5">
            <ChevronLeft size={20} className="-rotate-90 text-text-muted/30" />
          </div>
        </div>

        {/* Support Entry Point */}
        <button 
          onClick={() => navigate('/support')}
          className="w-full bg-white border border-black/5 p-8 rounded-[40px] flex items-center justify-between group hover:bg-neutral-50 transition-all text-left shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
              <HelpCircle size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase leading-tight text-text-main">{t('layout.supportFaq')}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">{t('settings.faqContact')}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-black/5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <ChevronLeft size={20} className="rotate-180 text-text-muted/30" />
          </div>
        </button>

        {/* Permissions Center */}
        <div className="bg-white border border-black/5 p-8 rounded-[40px] shadow-sm group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase leading-tight text-text-main">{t('permissions.guide.manage')}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">App Reliability</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Geolocation */}
            <PermissionRow 
              label={t('permissions.location.title')}
              status={geoStatus === 'ready' || geoStatus === 'loading' ? 'granted' : geoStatus === 'denied' ? 'denied' : 'prompt'}
              onFix={() => setActiveGuide('location')}
              t={t}
            />
            {/* Camera */}
            <PermissionRow 
              label={t('permissions.camera.title')}
              status={cameraStatus as any}
              onFix={() => setActiveGuide('camera')}
              t={t}
            />
            {/* Notifications */}
            <PermissionRow 
              label={t('permissions.notifications.title')}
              status={notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'prompt'}
              onFix={() => notifStatus === 'default' ? requestNotif() : setActiveGuide('notifications')}
              t={t}
            />
          </div>
        </div>
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

function PermissionRow({ label, status, onFix, t }: { label: string, status: 'granted' | 'denied' | 'prompt' | 'unknown', onFix: () => void, t: any }) {
  const isGranted = status === 'granted';
  const isDenied = status === 'denied';

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-3xl border border-black/5 hover:border-black/10 transition-colors">
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
              : 'bg-white text-brand-primary border border-black/5 shadow-sm'
        }`}
      >
        {isGranted ? t('permissions.guide.statusGranted') : isDenied ? t('permissions.guide.manage') : t('permissions.guide.statusPrompt')}
      </button>
    </div>
  );
}

