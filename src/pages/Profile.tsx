import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, LogOut, CheckCircle, Clock, ChevronRight, Calendar, Users, X, Pencil, Settings, Ticket, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProfileSkeleton } from '@/components/Skeleton';

export default function Profile() {
  const { t } = useTranslation();
  const { profile, logout, user, isGuest } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    pending: 0,
    redeemed: 0,
    expired: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    dob: '',
    gender: '',
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);

  // Sync edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select(`
            status,
            deals (end_date)
          `);
        
        if (error) throw error;

        const now = new Date();
        const counts = data.reduce((acc, curr: any) => {
          // Handle Supabase join result which might be an object or an array depending on typing
          const deal = Array.isArray(curr.deals) ? curr.deals[0] : curr.deals;
          const isExpired = deal?.end_date && new Date(deal.end_date) < now;
          
          if (curr.status === 'redeemed') {
            acc.redeemed += 1;
          } else if (isExpired) {
            acc.expired += 1;
          } else {
            acc.pending += 1;
          }
          acc.total += 1;
          return acc;
        }, { pending: 0, redeemed: 0, expired: 0, total: 0 });

        setStats(counts);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  // Generate 100 truly diverse and happy presets
  const AVATAR_PRESETS = Array.from({ length: 100 }, (_, i) => ({
    id: `p-${i}`,
    label: `Persona ${i + 1}`,
    seed: `happy-persona-v2-${i}`, 
    style: 'avataaars'
  }));

  const getAvatarUrl = (preset: any = {}) => {
    try {
      const style = preset.style || 'avataaars';
      const seed = preset.seed || profile?.full_name || user?.email || 'user';
      
      // THE HAPPINESS GUARANTEE: 
      // By adding &mouth=smile, we override any random mouth from the seed.
      // This ensures 100% of avatars are happy and friendly.
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&mouth=smile`;
    } catch (e) {
      return null;
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // Sanitize: Convert empty strings to null for the database
      const sanitizedForm = {
        ...editForm,
        dob: editForm.dob === '' ? null : editForm.dob,
        gender: editForm.gender === '' ? null : editForm.gender,
        avatar_url: editForm.avatar_url === '' ? null : editForm.avatar_url
      };

      const { error } = await supabase
        .from('profiles')
        .update(sanitizedForm)
        .eq('id', user.id);
      
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(`${t('profile.saveFailed')} ` + (err.message || 'Check your internet connection'));
    } finally {
      setSaving(false);
    }
  };

  const navigateToCoupons = (filter: string) => {
    navigate(`/coupons?filter=${filter}`);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-brand-primary/5 rounded-[32px] flex items-center justify-center mb-8 border border-brand-primary/10">
          <User size={48} className="text-brand-primary opacity-40" />
        </div>
        <h2 className="text-2xl font-black text-text-main mb-3 tracking-tight">{t('layout.myProfile')}</h2>
        <p className="text-text-muted text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          {t('home.signInToClaim')}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-xs bg-brand-secondary text-white font-black py-5 rounded-full shadow-lg shadow-brand-secondary/20 hover:bg-brand-primary transition-all text-sm uppercase tracking-widest"
        >
          {t('common.signIn')}
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-[24px] p-8 text-center max-w-sm mx-auto mt-10">
        <h3 className="font-bold text-red-900 text-lg mb-2">{t('profile.connectionIssues')}</h3>
        <p className="text-red-700/70 text-sm mb-6 leading-relaxed">
          {t('profile.connectionDesc')}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-red-600 font-bold hover:underline"
        >
          {t('home.retryCheckBtn')}
        </button>
      </div>
    );
  }

  // Display Avatar Logic - Bulletproof
  const displayAvatar = profile.avatar_url || getAvatarUrl();

  return (
    <div className="space-y-8 pb-24">
      {/* Header / Identity */}
      <section className="text-center pt-8">
        <div className="relative inline-block mb-10 group">
          {/* 3D Background Plate */}
          <div className="absolute inset-0 bg-brand-primary/10 rounded-[44px] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-secondary/20 rounded-[44px] rotate-6 group-hover:rotate-12 transition-transform duration-700"></div>
          
          <div className="relative w-32 h-32 bg-white rounded-[44px] flex items-center justify-center text-brand-primary shadow-premium mx-auto border border-black/5 overflow-hidden group-hover:-translate-y-2 group-hover:rotate-2 transition-all duration-500 z-10">
            {displayAvatar ? (
               <img 
                 src={displayAvatar as string} 
                 alt="Profile" 
                 className="w-full h-full object-cover p-2 group-hover:scale-110 transition-transform duration-700" 
                 onError={(e) => { 
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none'; 
                   if (target.nextElementSibling) {
                     (target.nextElementSibling as HTMLElement).style.display = 'flex'; 
                   }
                 }}
               />
            ) : null}
            <div className="hidden w-full h-full items-center justify-center text-4xl font-black uppercase">
               {getInitials(profile.full_name)}
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute -bottom-2 -right-2 bg-white text-brand-primary p-3 rounded-2xl shadow-xl border border-black/5 hover:bg-brand-primary hover:text-white hover:scale-110 transition-all z-20"
          >
             <Pencil size={18} />
          </button>
        </div>
        <h2 className="text-3xl font-black text-text-main tracking-tight">{profile.full_name || t('profile.defaultName')}</h2>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="bg-brand-primary/5 text-brand-primary text-[10px] uppercase font-black px-3 py-1.5 rounded-xl border border-brand-primary/10">
            {profile.role?.replace('_', ' ')}
          </span>
          <span className="text-text-muted text-xs font-bold flex items-center gap-1.5">
            <Shield size={14} className="text-brand-primary" /> {t('profile.verifiedMember')}
          </span>
        </div>
      </section>

      {/* Stats Summary Removed - Integrated below */}
      <section className="space-y-4">
        <h3 className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] ml-2">{t('profile.accountInfo', { defaultValue: 'Información de Cuenta' })}</h3>
        <div className="bg-white rounded-[40px] shadow-premium border border-black/5 overflow-hidden divide-y divide-black/5">
          <div onClick={() => setIsEditing(true)} className="p-6 flex items-center justify-between group cursor-pointer hover:bg-neutral-50 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-brand-primary/5 text-brand-primary rounded-2xl flex items-center justify-center border border-brand-primary/10 group-hover:bg-brand-primary/10 transition-colors">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase font-black tracking-widest mb-0.5">{t('profile.birthday')}</p>
                <p className="text-base font-bold text-text-main">
                  {profile.dob ? new Date(profile.dob + 'T12:00:00').toLocaleDateString() : t('profile.setBirthday')}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted/30 group-hover:text-text-main transition-colors" />
          </div>

          <div onClick={() => setIsEditing(true)} className="p-6 flex items-center justify-between group cursor-pointer hover:bg-neutral-50 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-brand-primary/5 text-brand-primary rounded-2xl flex items-center justify-center border border-brand-primary/10 group-hover:bg-brand-primary/10 transition-colors">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase font-black tracking-widest mb-0.5">{t('profile.gender')}</p>
                <p className="text-base font-bold text-text-main capitalize">
                  {profile.gender ? t(`profile.${profile.gender}`) : t('profile.preferNotToSay')}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-muted/30 group-hover:text-text-main transition-colors" />
          </div>

          <div className="p-6 flex items-center gap-5 bg-neutral-50/50">
            <div className="w-12 h-12 bg-white text-text-muted/20 rounded-2xl flex items-center justify-center border border-black/5">
              <Mail size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted uppercase font-black tracking-widest mb-0.5">{t('profile.email')}</p>
              <p className="text-sm font-bold text-text-muted/70 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Coupon History Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] ml-2">{t('profile.couponHistory')}</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => navigate('/coupons')}
            className="bg-white border border-black/5 rounded-3xl p-4 text-left group hover:border-brand-primary/30 transition-all shadow-sm active:scale-95 flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 bg-brand-primary/5 text-brand-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Ticket size={20} />
            </div>
            <p className="text-[11px] font-black text-text-main line-clamp-1">{t('profile.activeDeals')}</p>
            <p className="text-sm font-black text-brand-primary mt-1">{stats.pending}</p>
          </button>

          <button 
            onClick={() => navigateToCoupons('redeemed')}
            className="bg-white border border-black/5 rounded-3xl p-4 text-left group hover:border-brand-secondary/30 transition-all shadow-sm active:scale-95 flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <p className="text-[11px] font-black text-text-main line-clamp-1">{t('profile.redeemed')}</p>
            <p className="text-sm font-black text-brand-secondary mt-1">{stats.redeemed}</p>
          </button>
          
          <button 
            onClick={() => navigateToCoupons('expired')}
            className="bg-white border border-black/5 rounded-3xl p-4 text-left group hover:border-black/20 transition-all shadow-sm active:scale-95 flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 bg-neutral-100 text-text-muted rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <p className="text-[11px] font-black text-text-main line-clamp-1">{t('profile.expired')}</p>
            <p className="text-sm font-black text-text-muted mt-1">{stats.expired}</p>
          </button>
        </div>
      </section>

      {/* Edit Modal Refined */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
          <div className="bg-white w-full max-w-lg rounded-t-[64px] border-t border-black/5 shadow-22xl overflow-hidden animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] flex flex-col relative">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-black/5 rounded-full mx-auto mt-6 mb-2"></div>
            
            <form onSubmit={handleSaveProfile} className="p-8 pb-12 overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary">
                    <Settings size={22} />
                  </div>
                  <h3 className="text-2xl font-black text-text-main tracking-tight">{t('profile.identitySettings')}</h3>
                </div>
                <button type="button" onClick={() => setIsEditing(false)} className="text-text-muted hover:text-text-main transition-colors p-2.5 bg-neutral-100 rounded-xl border border-black/5">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Avatar Selection Light Scroll */}
                <div className="bg-neutral-50 rounded-[40px] p-6 border border-black/5 shadow-inner">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-5 ml-2">{t('profile.identityPersona')}</label>
                  <div className="max-h-[160px] overflow-y-auto px-1 py-1 scrollbar-hide">
                    <div className="grid grid-cols-4 gap-4">
                      {AVATAR_PRESETS.map((preset) => {
                        const url = getAvatarUrl(preset);
                        const isSelected = editForm.avatar_url === url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditForm({...editForm, avatar_url: url || ''})}
                            className={`relative aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-1.5 ${
                              isSelected ? 'border-brand-primary bg-brand-primary/5 scale-110' : 'border-black/5 bg-white hover:border-black/10'
                            }`}
                          >
                            <img src={url || ''} alt={preset.label} className="w-full h-full object-contain" />
                            {isSelected && (
                               <div className="absolute inset-0 bg-brand-primary/5 flex items-center justify-center">
                                 <div className="bg-white rounded-full p-1 shadow-lg">
                                   <CheckCircle size={14} className="text-brand-primary" />
                                 </div>
                               </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-[40px] p-8 border border-black/5 space-y-8 shadow-inner">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.fullName')}</label>
                    <input 
                      type="text" 
                      value={editForm.full_name}
                      onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full bg-white border border-black/5 rounded-[20px] px-6 py-5 text-sm font-bold text-text-main focus:ring-2 focus:ring-brand-primary/10 transition-all placeholder:text-text-muted/30"
                      placeholder={t('profile.yourNamePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.birthDate')}</label>
                      <input 
                        type="date" 
                        value={editForm.dob}
                        onChange={e => setEditForm({...editForm, dob: e.target.value})}
                        className="w-full bg-white border border-black/5 rounded-[20px] px-6 py-5 text-sm font-bold text-text-main focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.gender')}</label>
                      <div className="relative">
                        <select 
                          value={editForm.gender}
                          onChange={e => setEditForm({...editForm, gender: e.target.value})}
                          className="w-full bg-white border border-black/5 rounded-[20px] px-6 py-5 text-sm font-bold text-text-main focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all appearance-none"
                        >
                          <option value="">{t('profile.select')}</option>
                          <option value="male">{t('profile.male')}</option>
                          <option value="female">{t('profile.female')}</option>
                          <option value="other">{t('profile.other')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-neutral-100 text-text-muted font-black py-5 rounded-full hover:bg-neutral-200 transition-all text-[11px] uppercase tracking-[0.2em] border border-black/5"
                >
                  {t('profile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-brand-secondary text-white font-black py-5 rounded-full hover:bg-brand-primary transition-all text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-brand-secondary/20 disabled:opacity-50"
                >
                  {saving ? t('profile.syncing') : t('profile.updateProfile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out With Modern Light Button */}
      <section className="pt-6">
        <button 
          onClick={logout}
          className="w-full bg-red-50 text-red-500 font-extrabold py-6 rounded-[32px] border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group shadow-sm shadow-red-500/5"
        >
          <div className="p-2 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
             <LogOut size={22} />
          </div>
          {t('profile.signOut')}
        </button>
      </section>
    </div>
  );
}

