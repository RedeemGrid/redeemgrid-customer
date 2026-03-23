import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Clock, CheckCircle, ChevronLeft, X, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MyCoupons() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'active';
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          deals (
            title,
            description,
            image_url,
            end_date,
            id,
            category_id
          ),
          tenants (
            id,
            name,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);

      // Extract unique categories using ID mapping or names
      // Since we don't have the category names joined, we'll fetch them separately like in Home.jsx
      // Extract unique categories using ID mapping or names
      const { data: catsData } = await supabase.from('categories').select('*');
      const catsMap = (catsData || []).reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {});

      const enrichedCoupons = (data || []).map(c => ({
        ...c,
        categoryName: c.deals?.category_id ? catsMap[c.deals.category_id] : 'Other',
        tenants: {
          ...c.tenants,
          logo_url: c.tenants?.logo_url?.replace('via.placeholder.com', 'placehold.co')
        }
      }));

      setCoupons(enrichedCoupons);

      const uniqueCats = ['All', ...new Set(enrichedCoupons.map(c => c.categoryName))];
      setCategories(uniqueCats);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (tenantId) => {
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('tenant_id', tenantId);
    setBranches(data || []);
  };

  useEffect(() => {
    if (selectedCoupon?.tenants?.id) {
      fetchBranches(selectedCoupon.tenants.id);
    } else {
      setBranches([]);
    }
  }, [selectedCoupon]);

  const now = new Date();
  
  const filteredCoupons = coupons.filter(c => {
    const isExpired = c.deals?.end_date && new Date(c.deals.end_date) < now;
    
    // Tab filtering
    let match = false;
    if (currentFilter === 'redeemed') match = c.status === 'redeemed';
    else if (currentFilter === 'expired') match = c.status === 'pending' && isExpired;
    else match = c.status === 'pending' && !isExpired;
    
    if (!match) return false;

    // Category filtering
    if (activeCategory === 'All') return true;
    return c.categoryName === activeCategory;
  });

  // Helper for time remaining
  const getTimeRemaining = (endDate) => {
    const total = Date.parse(endDate) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (total <= 0) return null;
    if (days > 0) return `${days} ${t('coupons.daysLeft')}`;
    return `${hours} ${t('coupons.hoursLeft')}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    redeemed: 'bg-green-100 text-green-700 border-green-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
  };

  const openInMaps = (branch) => {
    if (!branch.location) return;
    // Standard Google Maps search URL with lat,lng
    // Supabase POINT type is usually { x: lng, y: lat } or similar in PostGIS logic
    const url = `https://www.google.com/maps/search/?api=1&query=${branch.location}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <Link to="/" className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/10">
          <ChevronLeft size={24} />
        </Link>
        <h2 className="text-3xl font-black text-white tracking-tight">{t('coupons.title')}</h2>
      </header>

      <div className="flex bg-white/5 p-1.5 rounded-[22px] backdrop-blur-md border border-white/10">
        {['active', 'redeemed', 'expired'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setSearchParams({ filter: f });
              setActiveCategory('All');
            }}
             className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
              currentFilter === f 
                ? 'bg-white text-brand-secondary shadow-xl scale-105' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t(`coupons.tab${f.charAt(0).toUpperCase() + f.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategory === cat 
                ? 'bg-white text-brand-secondary shadow-lg' 
                : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
              }`}
            >
              {cat === 'All' ? t('coupons.all') : t(`db_categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5">
        {filteredCoupons.length === 0 ? (
          <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] py-20 text-center px-8 backdrop-blur-md">
            <Ticket size={56} className="text-white/10 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">{t('coupons.noCouponsFound')}</h3>
            <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">
              {t('coupons.noCouponsFilter')}
            </p>
            <Link 
              to="/" 
              className="inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-[11px] font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl shadow-brand-primary/20 hover:opacity-90 transition-all active:scale-95 border border-white/10"
            >
              {t('coupons.exploreDeals')}
            </Link>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div 
              key={coupon.id}
              onClick={() => setSelectedCoupon(coupon)}
              className={`bg-white/10 backdrop-blur-lg rounded-[32px] shadow-xl border border-white/20 overflow-hidden active:scale-[0.97] transition-all duration-300 cursor-pointer group ${
                currentFilter !== 'active' ? 'grayscale opacity-60' : ''
              }`}
            >
              <div className="p-6 flex gap-5">
                <div className="w-18 h-18 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner overflow-hidden p-1.5">
                  {coupon.tenants?.logo_url ? (
                    <img src={coupon.tenants?.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center">
                       <Ticket size={28} className="text-brand-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-white text-lg truncate pr-2 group-hover:text-brand-primary transition-colors">
                      {coupon.deals?.title}
                    </h4>
                    {currentFilter === 'redeemed' && <CheckCircle size={18} className="text-green-400 flex-shrink-0" />}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                       {coupon.tenants?.name}
                    </p>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter ${
                      currentFilter === 'active' ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                       {t(`coupons.tab${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}`)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">
                      {currentFilter === 'expired' 
                        ? `${t('coupons.expiredLabel')} ${new Date(coupon.deals?.end_date).toLocaleDateString()}`
                        : `${t('coupons.claimedLabel')} ${new Date(coupon.created_at).toLocaleDateString()}`
                      }
                    </p>
                    {currentFilter === 'active' && getTimeRemaining(coupon.deals?.end_date) && (
                      <span className="text-[10px] px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black uppercase flex items-center gap-1.5">
                        <Clock size={12} /> {getTimeRemaining(coupon.deals?.end_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal / Detail Overlay */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg-end/60 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
          {/* Backdrop Glows */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

          <div className="bg-white/10 backdrop-blur-3xl w-full max-w-lg border-t border-white/20 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] flex flex-col relative isolate transform-gpu">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-6 mb-2"></div>
            
            <div className="p-8 relative flex-1 overflow-y-auto scrollbar-hide">
              <button 
                onClick={() => setSelectedCoupon(null)}
                className="absolute right-8 top-8 z-10 p-2.5 bg-white/10 text-white/60 hover:text-white hover:bg-white/20 rounded-full transition-all border border-white/10"
              >
                <X size={22} />
              </button>
              
                    {/* Header Info */}
                    <div className="flex items-center gap-5 mb-8 pt-4">
                       <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center p-2">
                          <img src={selectedCoupon.tenants?.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                       </div>
                       <div>
                          <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">{selectedCoupon.tenants?.name}</p>
                          <h3 className="text-2xl font-black text-white leading-tight">{selectedCoupon.deals?.title}</h3>
                       </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4 mb-10">
                       <div className="bg-white/5 backdrop-blur-md p-5 rounded-[32px] border border-white/10 shadow-inner">
                          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.claimedOn')}</p>
                          <p className="text-sm font-black text-white ml-1">{new Date(selectedCoupon.created_at).toLocaleDateString()}</p>
                       </div>
                       <div className={`p-5 rounded-[32px] border backdrop-blur-md shadow-inner ${getTimeRemaining(selectedCoupon.deals?.end_date)?.includes('h') ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.validUntil')}</p>
                          <p className={`text-sm font-black ml-1 ${getTimeRemaining(selectedCoupon.deals?.end_date)?.includes('h') ? 'text-orange-400' : 'text-white'}`}>
                             {new Date(selectedCoupon.deals?.end_date).toLocaleDateString()}
                             {getTimeRemaining(selectedCoupon.deals?.end_date) && <span className="block text-[10px] font-black uppercase mt-1 opacity-60 tracking-wider">⚡ {getTimeRemaining(selectedCoupon.deals?.end_date)}</span>}
                          </p>
                       </div>
                    </div>
                    
                    <p className="text-white/70 text-base leading-relaxed mb-10 px-1">{selectedCoupon.deals?.description}</p>
                    
                    {currentFilter === 'active' && (
                      <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[48px] text-center border border-white/10 shadow-3xl mb-10 relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary opacity-30"></div>
                        
                        <div className="relative inline-block group">
                          {/* Animated Border/Ring */}
                          <div className="absolute -inset-4 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-[40px] opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-500"></div>
                          
                          <div className="relative p-6 bg-white rounded-[36px] shadow-2xl">
                            <QRCodeSVG 
                              value={selectedCoupon.qr_code} 
                              size={180} 
                              level="H"
                              className="mx-auto"
                              includeMargin={false}
                            />
                          </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center">
                          <code className="bg-bg-end text-white/90 px-8 py-3.5 rounded-[20px] text-lg tracking-[0.3em] font-black border border-white/10 shadow-inner ring-1 ring-white/5">
                            {selectedCoupon.qr_code}
                          </code>
                          <div className="mt-8 flex items-center gap-2 bg-green-500/5 border border-green-500/20 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-green-400 animate-pulse">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {t('coupons.secureTokenActive')}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentFilter !== 'expired' && (
                      <div className="space-y-5">
                        <h4 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                          <MapPin size={20} className="text-brand-primary" />
                          {t('coupons.redemptionPoints')}
                        </h4>
                        <div className="grid gap-3">
                          {branches.length > 0 ? branches.map(branch => (
                            <div key={branch.id} className="bg-white/5 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
                              <div>
                                <p className="font-bold text-white text-base">{branch.name}</p>
                                <p className="text-xs text-white/40 font-medium mt-1">{t('coupons.viewOnMaps')}</p>
                              </div>
                              <button 
                                onClick={() => openInMaps(branch)}
                                className="bg-white text-brand-secondary p-3.5 rounded-2xl hover:opacity-90 active:scale-90 transition-all shadow-xl"
                              >
                                <Navigation size={20} fill="currentColor" />
                              </button>
                            </div>
                          )) : (
                            <p className="text-xs text-white/40 italic px-1">{t('coupons.discovering')}</p>
                          )}
                        </div>
                      </div>
                    )}
            </div>
            <div className="p-8 bg-white/5 border-t border-white/10">
              <button 
                onClick={() => setSelectedCoupon(null)}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 rounded-[28px] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
              >
                {t('coupons.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
