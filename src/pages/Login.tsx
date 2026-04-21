// @ts-nocheck
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../i18n';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { user, loading, loginWithGoogle, setGuestMode, isGuest } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-page text-text-muted font-black uppercase tracking-widest text-[10px] animate-pulse">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-page px-6 relative overflow-hidden">
      {/* Background Blobs for Login */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 blur-[140px] rounded-full animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-secondary/10 blur-[140px] rounded-full animate-blob animation-delay-2000"></div>

      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative bg-white border border-black/5 shadow-md rounded-full px-4 py-2 hover:bg-neutral-50 transition-all flex items-center gap-2 overflow-hidden cursor-pointer">
          <Globe size={14} className="text-text-muted" />
          <span className="text-text-main font-black uppercase tracking-widest text-[11px] mt-0.5">
            {i18n.language?.split('-')[0] === 'es' ? 'ES' : 'EN'}
          </span>
          <select 
            value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-white text-text-main">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[40px] border border-black/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="p-10 text-center">
          <div className="mx-auto w-24 h-24 bg-brand-primary/5 rounded-[32px] flex items-center justify-center mb-8 border border-brand-primary/10 group animate-bounce-slow overflow-hidden">
            <img src="pwa-192x192.png" alt="Nabbu Logo" className="w-full h-full object-cover p-2" />
          </div>
          <h1 className="text-4xl font-black text-text-main mb-3 tracking-tight">{t('login.welcome')} Nabbu</h1>
          <p className="text-text-muted mb-10 font-medium">{t('login.subtitle')}</p>
          
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-brand-secondary text-white rounded-full px-6 py-5 font-black text-sm uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg shadow-brand-secondary/20 active:scale-[0.98]"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-6 h-6" 
            />
            {t('login.signInGoogle')}
          </button>

          <button
            onClick={() => {
              setGuestMode(true);
              navigate('/');
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 text-text-muted hover:text-brand-primary font-black text-[10px] uppercase tracking-[0.2em] py-4 transition-all"
          >
            {t('login.continueAsGuest')}
          </button>
        </div>
        <div className="bg-neutral-50 px-10 py-6 text-center text-[10px] text-text-muted border-t border-black/5 font-bold uppercase tracking-tighter">
          {t('login.termsAgreed')} <Link to="/terms" className="text-brand-primary underline cursor-pointer hover:text-brand-primary/80 transition-colors">{t('login.termsLink')}</Link>.
        </div>
      </div>
    </div>
  );
}

