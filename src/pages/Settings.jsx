import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../i18n';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 -ml-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">{t('settings.title')}</h2>
      </header>

      <div className="space-y-6">
        {/* Language Selection */}
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-center justify-between group overflow-hidden hover:bg-white/10 transition-colors">
          <select 
            value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'}
            onChange={handleLanguageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base z-10"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-bg-mid text-white">
                {lang.name}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-4 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
              <Globe size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase italic leading-tight">{t('settings.language')}</p>
              <p className="mt-1 text-white/60 font-bold uppercase tracking-widest text-[10px]">
                {availableLanguages.find(l => l.code === (i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'))?.name || 'English'}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center pointer-events-none">
            <ChevronLeft size={20} className="-rotate-90 text-white/40" />
          </div>
        </div>

        {/* Support Entry Point */}
        <button 
          onClick={() => navigate('/support')}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-center justify-between group hover:bg-white/10 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
              <HelpCircle size={24} />
            </div>
            <div>
              <p className="font-black text-sm uppercase italic leading-tight">{t('layout.supportFaq')}</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{t('settings.faqContact')}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <ChevronLeft size={20} className="rotate-180" />
          </div>
        </button>

        {/* Placeholder for other settings */}
        <div className="p-10 border-2 border-dashed border-white/5 rounded-[40px] text-center">
          <p className="text-white/20 font-bold uppercase tracking-widest text-[10px] mb-2">{t('settings.preferences')}</p>
          <p className="text-white/40 text-sm font-medium">
            {t('settings.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}
