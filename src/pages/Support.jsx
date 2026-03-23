import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, HelpCircle, MessageCircle, Mail, 
  ChevronDown, ExternalLink, ShieldCheck, Ticket, 
  MapPin, AlertCircle 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../config';

export default function Support() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

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
          className="p-2.5 -ml-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">{t('support.title')}</h2>
      </header>

      <main className="space-y-8">
        {/* Intro */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[48px] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-brand-primary/20 rounded-3xl flex items-center justify-center mx-auto border border-brand-primary/30 shadow-xl shadow-brand-primary/10 mb-6">
              <HelpCircle size={40} className="text-brand-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">{t('support.introTitle')}</h3>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{t('support.introSubtitle')}</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary px-2">{t('support.faqSection')}</h3>
          {faqs.map((faq) => (
            <div 
              key={faq.id}
              className={`
                bg-white/5 backdrop-blur-md rounded-[32px] border transition-all duration-300 overflow-hidden
                ${openFaq === faq.id ? 'border-brand-primary/40 bg-white/10' : 'border-white/10'}
              `}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center gap-4 p-6 text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center flex-shrink-0">
                  {faq.icon}
                </div>
                <span className="flex-1 font-bold text-sm leading-tight">{faq.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-white/20 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180 text-brand-primary' : ''}`} 
                />
              </button>
              
              <div 
                className={`
                  px-6 transition-all duration-300 ease-in-out
                  ${openFaq === faq.id ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="pl-14">
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
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
              className="group bg-gradient-to-br from-brand-primary to-brand-primary/80 p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Mail size={24} className="text-white" />
              </div>
              <div>
                <p className="font-black text-white text-sm">{t('support.sendEmail')}</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">support@{APP_CONFIG.companyUrl.replace('https://', '')}</p>
              </div>
            </a>

            <button 
              className="group bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px] flex items-center gap-4 hover:bg-white/10 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="font-black text-white text-sm">{t('support.liveChat')}</p>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">{t('support.comingSoon')}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-10">
          <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
            {t('support.businessHours')}
          </p>
        </div>
      </main>
    </div>
  );
}
