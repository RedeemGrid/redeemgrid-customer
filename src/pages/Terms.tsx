import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Shield, Scale, MapPin, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Shield className="text-brand-primary" size={24} />,
      title: t('terms.sec1Title'),
      text: t('terms.sec1Text')
    },
    {
      icon: <MapPin className="text-brand-primary" size={24} />,
      title: t('terms.sec2Title'),
      text: t('terms.sec2Text')
    },
    {
      icon: <Scale className="text-brand-primary" size={24} />,
      title: t('terms.sec3Title'),
      text: t('terms.sec3Text')
    },
    {
      icon: <EyeOff className="text-brand-primary" size={24} />,
      title: t('terms.sec4Title'),
      text: t('terms.sec4Text')
    },
    {
      icon: <Globe className="text-brand-primary" size={24} />,
      title: t('terms.sec5Title'),
      text: t('terms.sec5Text')
    }
  ];

  return (
    <div className="min-h-screen bg-bg-page text-text-main selection:bg-brand-primary/10">
      <div className="max-w-xl mx-auto px-6 py-6 transition-all duration-300 space-y-8 pb-24">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl border border-black/5 shadow-sm transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-text-main tracking-tight">{t('terms.title')}</h1>
      </header>

      <main className="space-y-6">
        <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-black/5 bg-brand-primary/5">
            <h2 className="text-2xl font-black mb-2 text-text-main">{t('terms.title')}</h2>
            <p className="text-text-muted/40 text-xs font-bold uppercase tracking-widest">{t('terms.lastUpdated')}</p>
          </div>

          <div className="p-8 space-y-10">
            {sections.map((section, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-black/5 shadow-sm">
                  {section.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-text-main">{section.title}</h3>
                  <p className="text-text-muted leading-relaxed text-sm font-medium">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-neutral-50 border-t border-black/5">
            <p className="text-[10px] text-text-muted/30 font-bold uppercase tracking-widest leading-loose text-center italic">
              {t('terms.footer')}
            </p>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
