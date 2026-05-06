import { useTranslation } from 'react-i18next';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { 
  ShieldCheck, Camera, MapPin, Bell, 
  CheckCircle2, 
  Check, AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PermissionBridge() {
  const { t } = useTranslation();
  const cameraStatus = useCameraPermission();
  const { permissionStatus: geoStatus, requestLocation } = useGeolocation();
  const { status: notifStatus, request: requestNotif } = useNotificationPermission();
  
  const [allGranted, setAllGranted] = useState(false);

  useEffect(() => {
    const isCameraOk = cameraStatus === 'granted';
    const isGeoOk = geoStatus === 'ready' || geoStatus === 'loading';
    const isNotifOk = notifStatus === 'granted';
    
    if (isCameraOk && isGeoOk && isNotifOk) {
      setAllGranted(true);
    } else {
      setAllGranted(false);
    }
  }, [cameraStatus, geoStatus, notifStatus]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center p-6 py-12 md:py-20 selection:bg-brand-primary/10">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-700">
        <header className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-primary text-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase leading-none">
            {t('permissions.bridge.title')}
          </h1>
          <p className="text-text-muted text-sm font-medium max-w-xs mx-auto">
            {t('permissions.bridge.desc')}
          </p>
        </header>

        <div className="space-y-4">
          <PermissionCard 
            icon={<Camera size={24} />}
            label={t('permissions.camera.title')}
            desc={t('permissions.bridge.cameraExp')}
            status={cameraStatus === 'granted' ? 'granted' : cameraStatus === 'denied' ? 'denied' : 'prompt'}
            onGrant={() => {/* Browser Lock Menu instruction is better for camera if blocked */}}
            t={t}
          />
          
          <PermissionCard 
            icon={<MapPin size={24} />}
            label={t('permissions.location.title')}
            desc={t('permissions.bridge.locationExp')}
            status={geoStatus === 'ready' || geoStatus === 'loading' ? 'granted' : geoStatus === 'denied' ? 'denied' : 'prompt'}
            onGrant={requestLocation}
            t={t}
          />
          
          <PermissionCard 
            icon={<Bell size={24} />}
            label={t('permissions.notifications.title')}
            desc={t('permissions.bridge.notifExp')}
            status={notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'prompt'}
            onGrant={requestNotif}
            t={t}
          />
        </div>

        {allGranted ? (
          <div className="bg-brand-secondary text-white p-8 rounded-[32px] text-center shadow-xl shadow-brand-secondary/20 animate-in zoom-in duration-500 mt-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-secondary mx-auto mb-4 shadow-sm">
              <Check size={24} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              {t('permissions.bridge.returnTitle')}
            </h3>
            <p className="text-white/80 text-sm font-medium leading-relaxed">
              {t('permissions.bridge.returnDesc')}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-black/5 p-6 rounded-3xl text-center">
             <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                <AlertCircle size={14} className="text-status-error" />
                {t('permissions.guide.stepBrowserLock')}
             </div>
          </div>
        )}

        <footer className="text-center pt-8 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Tróvea Control Center</p>
        </footer>
      </div>
    </div>
  );
}

function PermissionCard({ icon, label, desc, status, onGrant, t }: { icon: any, label: string, desc: string, status: 'granted' | 'denied' | 'prompt', onGrant: () => void, t: any }) {
  const isGranted = status === 'granted';
  const isDenied = status === 'denied';

  return (
    <div className={`p-6 bg-white rounded-3xl border transition-all ${
      isGranted ? 'border-brand-secondary/20' : 'border-black/5 shadow-sm'
    }`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isGranted ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-neutral-100 text-text-muted'
        }`}>
          {icon}
        </div>
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black uppercase tracking-tight text-text-main">{label}</h4>
            {isGranted && <CheckCircle2 size={16} className="text-brand-secondary" />}
          </div>
          <p className="text-xs font-medium text-text-muted mt-1 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>

      {!isGranted && (
        <button 
          onClick={onGrant}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
            isDenied 
              ? 'bg-neutral-50 text-text-muted/30 border border-black/5 pointer-events-none'
              : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:opacity-90 active:scale-95'
          }`}
        >
          {isDenied ? t('permissions.guide.statusDenied') : t('permissions.bridge.grantBtn')}
        </button>
      )}
      
      {isGranted && (
        <div className="bg-brand-secondary/10 text-brand-secondary text-[10px] font-black uppercase tracking-widest py-3 rounded-xl text-center">
           {t('permissions.guide.statusGranted')}
        </div>
      )}
    </div>
  );
}
