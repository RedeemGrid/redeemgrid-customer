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
        <button onClick={() => navigate(-1)} className="p-2.5 -ml-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">{t('about.title')}</h2>
      </header>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[48px] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 mx-auto mb-6 transform group-hover:rotate-6 transition-transform">
              <Zap size={40} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">RedeemGrid</h3>
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              {t('about.tagline')}
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-5">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center border border-green-500/20">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-base">{t('about.secureTitle')}</h4>
              <p className="text-xs text-white/40 font-medium">{t('about.secureDesc')}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Globe size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-base">{t('about.localTitle')}</h4>
              <p className="text-xs text-white/40 font-medium">{t('about.localDesc')}</p>
            </div>
          </div>
        </div>

        {/* External Link Section */}
        <div className="pt-4">
          <button 
            onClick={() => window.open(APP_CONFIG.companyUrl, '_blank')}
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-center justify-between group hover:bg-white/10 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60">
                <Globe size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase italic leading-tight">{t('about.visitWebsite')}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1 text-brand-secondary">{APP_CONFIG.companyUrl.replace('https://', '')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center mt-12 pb-10">
        <p className="text-white/20 font-bold uppercase tracking-widest text-[10px] font-mono">
          V {APP_CONFIG.version} • Made with ❤️
        </p>
      </div>
    </div>
  );
}
