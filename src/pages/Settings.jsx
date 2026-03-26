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
        <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('settings.title')}</h2>
      </header>

      <div className="space-y-6">
        {/* Language Selection */}
        <div className="relative bg-white border border-black/5 p-6 rounded-[32px] flex items-center justify-between group overflow-hidden hover:bg-neutral-50 transition-colors shadow-sm">
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
          className="w-full bg-white border border-black/5 p-6 rounded-[32px] flex items-center justify-between group hover:bg-neutral-50 transition-all text-left shadow-sm"
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

        {/* Placeholder for other settings */}
        <div className="p-10 border-2 border-dashed border-black/5 rounded-[40px] text-center">
          <p className="text-text-muted/30 font-bold uppercase tracking-widest text-[10px] mb-2">{t('settings.preferences')}</p>
          <p className="text-text-muted text-sm font-medium">
            {t('settings.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}
