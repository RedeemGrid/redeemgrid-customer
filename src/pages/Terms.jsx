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
    <div className="min-h-screen bg-bg-end bg-gradient-to-br from-bg-start via-bg-mid to-bg-end text-white selection:bg-brand-primary/30">
      <div className="max-w-xl mx-auto px-6 py-6 transition-all duration-300 space-y-8 pb-24">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 -ml-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-white tracking-tight">{t('terms.title')}</h1>
      </header>

      <main className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/10 bg-gradient-to-r from-brand-primary/10 to-transparent">
            <h2 className="text-2xl font-black mb-2">{t('terms.title')}</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('terms.lastUpdated')}</p>
          </div>

          <div className="p-8 space-y-10">
            {sections.map((section, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                  {section.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white/90">{section.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm font-medium">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-loose text-center italic">
              {t('terms.footer')}
            </p>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
