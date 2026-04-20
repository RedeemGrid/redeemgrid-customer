// @ts-nocheck
import { ShieldCheck, UserCheck, Star, Zap, Phone, Info, Globe, Smartphone, Heart, ChevronLeft, Copy, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../config';

export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight">{t('about.title')}</h2>
      </header>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-brand-primary/5 rounded-[32px] flex items-center justify-center text-brand-primary shadow-premium border border-black/5 mx-auto mb-6 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
              <img src="pwa-192x192.png" alt="Nabbu" className="w-12 h-12 object-contain" />
            </div>
            <h3 className="text-2xl font-black text-text-main mb-3">Nabbu</h3>
            <p className="text-text-muted text-sm leading-relaxed font-medium">
              {t('about.tagline')}
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4">
          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-brand-secondary/10 text-brand-secondary rounded-2xl flex items-center justify-center border border-brand-secondary/20">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-text-main text-base">{t('about.secureTitle')}</h4>
              <p className="text-xs text-text-muted font-medium">{t('about.secureDesc')}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center border border-brand-primary/20">
              <Globe size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-text-main text-base">{t('about.localTitle')}</h4>
              <p className="text-xs text-text-muted font-medium">{t('about.localDesc')}</p>
            </div>
          </div>
        </div>

        {/* External Link Section */}
        <div className="pt-4">
          <button 
            onClick={() => window.open(APP_CONFIG.companyUrl, '_blank')}
            className="w-full bg-white border border-black/5 p-6 rounded-[32px] flex items-center justify-between group hover:bg-neutral-50 transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-text-muted">
                <Globe size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase italic leading-tight text-text-main">{t('about.visitWebsite')}</p>
                <p className="text-brand-secondary text-[10px] font-bold uppercase tracking-widest mt-1">{APP_CONFIG.companyUrl.replace('https://', '')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center mt-12 pb-10">
        <p className="text-text-muted/40 font-bold uppercase tracking-widest text-[10px] font-mono">
          V {APP_CONFIG.version} • Made with ❤️
        </p>
      </div>
    </div>
  );
}

