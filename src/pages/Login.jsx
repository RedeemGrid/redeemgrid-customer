import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { LogIn, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../i18n';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-end text-white/40 font-bold uppercase tracking-widest text-[10px]">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-end bg-gradient-to-br from-bg-start via-bg-mid to-bg-end px-6 relative overflow-hidden">
      {/* Background Blobs for Login */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/20 blur-[140px] rounded-full animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-secondary/20 blur-[140px] rounded-full animate-blob animation-delay-2000"></div>

      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl rounded-full px-4 py-2 hover:bg-white/20 transition-all flex items-center gap-2 overflow-hidden cursor-pointer">
          <Globe size={14} className="text-white/80" />
          <span className="text-white font-black uppercase tracking-widest text-[11px] mt-0.5">
            {i18n.language?.split('-')[0] === 'es' ? 'ES' : 'EN'}
          </span>
          <select 
            value={i18n.resolvedLanguage || i18n.language?.split('-')[0] || 'en'}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-bg-mid text-white">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[48px] border border-white/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="p-10 text-center">
          <div className="mx-auto w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-8 border border-white/10 group animate-bounce-slow">
            <LogIn size={36} className="text-brand-primary group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">{t('login.welcome')} RedeemGrid</h1>
          <p className="text-white/40 mb-10 font-medium">{t('login.subtitle')}</p>
          
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl px-6 py-5 font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-[0.98] border border-white/10 shadow-brand-primary/20"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-6 h-6" 
            />
            {t('login.signInGoogle')}
          </button>
        </div>
        <div className="bg-white/5 px-10 py-6 text-center text-xs text-white/30 border-t border-white/10 font-bold uppercase tracking-tighter">
          {t('login.termsAgreed')} <Link to="/terms" className="text-white/60 underline cursor-pointer hover:text-white transition-colors">{t('login.termsLink')}</Link>.
        </div>
      </div>
    </div>
  );
}
