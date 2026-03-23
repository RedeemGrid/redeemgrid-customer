import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Wallet, CheckCircle, Clock, ChevronRight, Loader2, Calendar, Users, AlertCircle, X, Pencil, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const { profile, logout, user } = useAuth();
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
        const counts = data.reduce((acc, curr) => {
          const isExpired = curr.deals?.end_date && new Date(curr.deals.end_date) < now;
          
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

  const getAvatarUrl = (preset = {}) => {
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

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(`${t('profile.saveFailed')} ` + (err.message || 'Check your internet connection'));
    } finally {
      setSaving(false);
    }
  };

  const navigateToCoupons = (filter) => {
    navigate(`/coupons?filter=${filter}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 size={48} className="text-white/20 mb-4 animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{t('profile.preparingProfile')}</p>
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
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-brand-primary/20 mx-auto border-4 border-white/20 overflow-hidden backdrop-blur-md">
            {displayAvatar ? (
               <img 
                 src={displayAvatar} 
                 alt="Profile" 
                 className="w-full h-full object-cover p-1.5" 
                 onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
               />
            ) : null}
            <div className="hidden w-full h-full items-center justify-center text-3xl font-black uppercase">
               {getInitials(profile.full_name)}
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute bottom-2 -right-2 bg-white text-brand-secondary p-2.5 rounded-2xl shadow-xl border border-white/20 hover:scale-110 transition-transform flex items-center justify-center"
          >
             <Pencil size={16} />
          </button>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">{profile.full_name || t('profile.defaultName')}</h2>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="bg-white/10 text-brand-primary text-[10px] uppercase font-black px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            {profile.role?.replace('_', ' ')}
          </span>
          <span className="text-white/40 text-xs font-bold flex items-center gap-1.5">
            <Shield size={14} className="text-brand-primary" /> {t('profile.verifiedMember')}
          </span>
        </div>
      </section>

      {/* Stats Summary - New Glass Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{t('profile.activeDeals')}</p>
          <p className="text-2xl font-black text-white">{stats.pending}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{t('profile.redeemed')}</p>
          <p className="text-2xl font-black text-green-400">{stats.redeemed}</p>
        </div>
      </div>

      {/* Details & Info in a Glass Container */}
      <section className="bg-white/10 backdrop-blur-lg rounded-[40px] shadow-xl border border-white/20 overflow-hidden divide-y divide-white/5">
        <div 
          onClick={() => setIsEditing(true)}
          className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/5 text-brand-primary rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[11px] text-white/40 uppercase font-black tracking-widest mb-0.5">{t('profile.birthday')}</p>
              <p className="text-base font-bold text-white">
                {profile.dob ? new Date(profile.dob + 'T12:00:00').toLocaleDateString() : t('profile.setBirthday')}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
        </div>

        <div 
          onClick={() => setIsEditing(true)}
          className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/5 text-pink-400 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] text-white/40 uppercase font-black tracking-widest mb-0.5">{t('profile.gender')}</p>
              <p className="text-base font-bold text-white capitalize">
                {profile.gender ? t(`profile.${profile.gender}`) : t('profile.preferNotToSay')}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
        </div>

        <div className="p-6 flex items-center justify-between group bg-white/5">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/5 text-white/30 rounded-2xl flex items-center justify-center border border-white/10">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[11px] text-white/40 uppercase font-black tracking-widest mb-0.5">{t('profile.email')}</p>
              <p className="text-base font-bold text-white/70">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal Refined */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg-end/60 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
          {/* Backdrop Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[120px] animate-pulse"></div>
          
          <div className="bg-white/10 backdrop-blur-3xl w-full max-w-lg rounded-t-[64px] border-t border-x border-white/20 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] flex flex-col relative">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-6 mb-2"></div>
            
            <form onSubmit={handleSaveProfile} className="p-8 pb-12 overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                    <Settings size={22} />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{t('profile.identitySettings')}</h3>
                </div>
                <button type="button" onClick={() => setIsEditing(false)} className="text-white/30 hover:text-white transition-colors p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Avatar Selection Glassy Scroll */}
                <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-6 border border-white/10 shadow-inner">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-5 ml-2">{t('profile.identityPersona')}</label>
                  <div className="max-h-[160px] overflow-y-auto px-1 py-1 scrollbar-hide">
                    <div className="grid grid-cols-4 gap-4">
                      {AVATAR_PRESETS.map((preset) => {
                        const url = getAvatarUrl(preset);
                        const isSelected = editForm.avatar_url === url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditForm({...editForm, avatar_url: url})}
                            className={`relative aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-1.5 ${
                              isSelected ? 'border-brand-primary bg-brand-primary/20 scale-110' : 'border-white/5 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <img src={url} alt={preset.label} className="w-full h-full object-contain" />
                            {isSelected && (
                               <div className="absolute inset-0 bg-brand-primary/10 backdrop-blur-[1px] flex items-center justify-center">
                                 <div className="bg-white rounded-full p-1 shadow-lg shadow-brand-primary/50">
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

                <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 space-y-8 shadow-inner">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.fullName')}</label>
                    <input 
                      type="text" 
                      value={editForm.full_name}
                      onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-5 text-sm font-bold text-white focus:ring-2 focus:ring-brand-primary/40 focus:bg-white/10 focus:border-brand-primary/20 outline-none transition-all placeholder:text-white/20"
                      placeholder={t('profile.yourNamePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.birthDate')}</label>
                      <input 
                        type="date" 
                        value={editForm.dob}
                        onChange={e => setEditForm({...editForm, dob: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-5 text-xs font-bold text-white focus:ring-2 focus:ring-brand-primary/40 focus:bg-white/10 outline-none transition-all color-scheme-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2">{t('profile.gender')}</label>
                      <div className="relative">
                        <select 
                          value={editForm.gender}
                          onChange={e => setEditForm({...editForm, gender: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-5 text-xs font-bold text-white focus:ring-2 focus:ring-brand-primary/40 focus:bg-white/10 outline-none transition-all appearance-none"
                        >
                          <option value="" className="bg-bg-end">{t('profile.select')}</option>
                          <option value="male" className="bg-bg-end">{t('profile.male')}</option>
                          <option value="female" className="bg-bg-end">{t('profile.female')}</option>
                          <option value="other" className="bg-bg-end">{t('profile.other')}</option>
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
                  className="flex-1 bg-white/5 text-white/60 font-black py-5 rounded-[28px] hover:bg-white/10 transition-all text-[11px] uppercase tracking-[0.2em] border border-white/5"
                >
                  {t('profile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 rounded-[28px] hover:opacity-90 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                >
                  {saving ? t('profile.syncing') : t('profile.updateProfile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out With Red Glass Glow */}
      <section className="pt-6">
        <button 
          onClick={logout}
          className="w-full bg-red-500/10 text-red-400 font-extrabold py-6 rounded-[32px] border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group shadow-xl shadow-red-500/5 backdrop-blur-md"
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
