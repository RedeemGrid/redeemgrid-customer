import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, HelpCircle, MessageCircle, Mail, 
  ChevronDown, ShieldCheck, Ticket, 
  MapPin, AlertCircle 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../config';

export default function Support() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      icon: <Ticket className="text-brand-primary" size={20} />,
      question: t('support.faq1Q'),
      answer: t('support.faq1A')
    },
    {
      id: 2,
      icon: <MapPin className="text-brand-primary" size={20} />,
      question: t('support.faq2Q'),
      answer: t('support.faq2A')
    },
    {
      id: 3,
      icon: <ShieldCheck className="text-brand-primary" size={20} />,
      question: t('support.faq3Q'),
      answer: t('support.faq3A')
    },
    {
      id: 4,
      icon: <AlertCircle className="text-brand-primary" size={20} />,
      question: t('support.faq4Q'),
      answer: t('support.faq4A')
    }
  ];

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl border border-black/5 shadow-sm transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('support.title')}</h2>
      </header>

      <main className="space-y-8">
        {/* Intro */}
        <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-brand-primary/5 rounded-3xl flex items-center justify-center mx-auto border border-brand-primary/10 shadow-sm mb-6">
              <HelpCircle size={40} className="text-brand-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-text-main mb-2 uppercase tracking-tighter">{t('support.introTitle')}</h3>
            <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">{t('support.introSubtitle')}</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary px-2">{t('support.faqSection')}</h3>
          {faqs.map((faq) => (
            <div 
              key={faq.id}
              className={`
                bg-white rounded-[32px] border transition-all duration-300 overflow-hidden shadow-sm
                ${openFaq === faq.id ? 'border-brand-primary/20 bg-neutral-50' : 'border-black/5'}
              `}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center gap-4 p-6 text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-black/5">
                  {faq.icon}
                </div>
                <span className="flex-1 font-bold text-sm leading-tight text-text-main">{faq.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-text-muted/30 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180 text-brand-primary' : ''}`} 
                />
              </button>
              
              <div 
                className={`
                  px-6 transition-all duration-300 ease-in-out
                  ${openFaq === faq.id ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="pl-14">
                  <p className="text-text-muted text-sm leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Actions */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary px-2">{t('support.contactSection')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href={`mailto:support@${APP_CONFIG.companyUrl.replace('https://', '')}`}
              className="group bg-brand-primary p-6 rounded-[32px] flex items-center gap-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Mail size={24} className="text-white" />
              </div>
              <div>
                <p className="font-black text-white text-sm">{t('support.sendEmail')}</p>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">support@{APP_CONFIG.companyUrl.replace('https://', '')}</p>
              </div>
            </a>

            <button 
              className="group bg-white border border-black/5 p-6 rounded-[32px] flex items-center gap-4 hover:bg-neutral-50 transition-all text-left shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary border border-brand-secondary/20">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="font-black text-text-main text-sm">{t('support.liveChat')}</p>
                <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-widest">{t('support.comingSoon')}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-10">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
            {t('support.businessHours')}
          </p>
        </div>
      </main>
    </div>
  );
}
