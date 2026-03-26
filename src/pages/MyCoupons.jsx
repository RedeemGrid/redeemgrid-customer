import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Clock, CheckCircle, ChevronLeft, X, AlertCircle, MapPin, Navigation, ScanLine, QrCode } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OfferDetailModal from '../components/OfferDetailModal';
import SafeImage from '../components/SafeImage';

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
  const [showQrCode, setShowQrCode] = useState(false);
  const navigate = useNavigate();

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

      const targetId = searchParams.get('id');
      if (targetId) {
        const targetCoupon = enrichedCoupons.find(c => c.id === targetId);
        if (targetCoupon) {
          setSelectedCoupon(targetCoupon);
          searchParams.delete('id');
          setSearchParams(searchParams, { replace: true });
        }
      }
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
    pending: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    redeemed: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
    expired: 'bg-red-50 text-red-600 border-red-100',
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
      <div className="flex justify-center items-center py-20 animate-pulse">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <Link to="/" className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl transition-all border border-black/5 shadow-sm">
          <ChevronLeft size={24} />
        </Link>
        <h2 className="text-3xl font-black text-text-main tracking-tight">{t('coupons.title')}</h2>
      </header>

      <div className="flex glass-light p-1.5 rounded-[22px] shadow-sm">
        {['active', 'redeemed', 'expired'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setSearchParams({ filter: f });
              setActiveCategory('All');
            }}
             className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
              currentFilter === f 
                ? 'bg-brand-primary text-white shadow-lg scale-105' 
                : 'text-text-muted hover:text-text-main'
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
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                activeCategory === cat 
                ? 'bg-brand-primary text-white border-transparent shadow-lg' 
                : 'bg-white text-text-muted border-black/5 hover:border-black/10'
              }`}
            >
              {cat === 'All' ? t('coupons.all') : t(`db_categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5">
        {filteredCoupons.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black/5 rounded-[40px] py-20 text-center px-8 shadow-sm">
            <Ticket size={56} className="text-neutral-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-text-main mb-2">{t('coupons.noCouponsFound')}</h3>
            <p className="text-text-muted text-sm mb-8 max-w-xs mx-auto">
              {t('coupons.noCouponsFilter')}
            </p>
            <Link 
              to="/" 
              className="inline-block bg-brand-secondary text-white text-[11px] font-black uppercase tracking-widest px-10 py-5 rounded-full shadow-lg shadow-brand-secondary/20 hover:bg-brand-primary transition-all active:scale-95"
            >
              {t('coupons.exploreDeals')}
            </Link>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div 
              key={coupon.id}
              onClick={() => {
                setSelectedCoupon(coupon);
                setShowQrCode(false);
              }}
              className={`bg-white rounded-[32px] shadow-premium border border-black/[0.03] overflow-hidden hover:shadow-card-hover hover:border-brand-primary/10 active:scale-[0.97] transition-all duration-300 cursor-pointer group flex flex-col h-full ${
                currentFilter !== 'active' ? 'grayscale opacity-70' : ''
              }`}
            >
              {/* Hero Image Section */}
              <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
                <SafeImage 
                  src={coupon.deals?.image_url} 
                  alt={coupon.deals?.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  placeholder={
                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                       <Ticket size={40} strokeWidth={1} className="animate-pulse" />
                    </div>
                  }
                />
                
                {/* Status Badge Over Image */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                   <div className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-tighter shadow-lg ${
                      currentFilter === 'active' 
                        ? 'bg-brand-primary text-white shadow-brand-primary/20' 
                        : 'bg-neutral-800 text-white shadow-black/20'
                    }`}>
                       {t(`coupons.tab${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}`)}
                   </div>
                   
                   {currentFilter === 'active' && getTimeRemaining(coupon.deals?.end_date) && (
                      <div className="glass-light px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 animate-pulse">
                        <Clock size={12} className="text-orange-500" />
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">
                          {getTimeRemaining(coupon.deals?.end_date)}
                        </span>
                      </div>
                   )}
                </div>

                {/* Claimed/Redeemed Date Over Image */}
                <div className="absolute bottom-4 left-4 z-10">
                   <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/20">
                      <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mb-0.5">
                        {currentFilter === 'expired' ? t('coupons.expiredLabel') : t('coupons.claimedLabel')}
                      </p>
                      <p className="text-[10px] font-black text-text-main">
                        {new Date(currentFilter === 'expired' ? coupon.deals?.end_date : coupon.created_at).toLocaleDateString()}
                      </p>
                   </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 border border-black/5 overflow-hidden flex-shrink-0">
                       {coupon.tenants?.logo_url ? (
                         <img src={coupon.tenants?.logo_url} alt="Logo" className="w-full h-full object-contain" />
                       ) : (
                        <div className="w-full h-full bg-brand-primary/5 flex items-center justify-center text-brand-primary font-bold text-xs">
                           {coupon.tenants?.name?.[0] || 'N'}
                         </div>
                       )}
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.15em] mb-0.5">{coupon.tenants?.name}</p>
                        {currentFilter === 'redeemed' && (
                          <div className="flex items-center gap-1 text-brand-secondary">
                            <CheckCircle size={10} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Canjeado</span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-text-main text-xl leading-snug group-hover:text-brand-primary transition-colors mb-2 line-clamp-2">
                  {coupon.deals?.title}
                </h3>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal / Detail Overlay */}
      {selectedCoupon && (
        <OfferDetailModal
          isOpen={!!selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          isCoupon={true}
          tenantName={selectedCoupon.tenants?.name}
          tenantLogo={selectedCoupon.tenants?.logo_url}
          title={selectedCoupon.deals?.title}
          description={selectedCoupon.deals?.description}
          imageUrl={selectedCoupon.deals?.image_url}
          endDate={selectedCoupon.deals?.end_date}
          claimedDate={selectedCoupon.created_at}
          qrCode={selectedCoupon.qr_code}
          showQrCode={showQrCode}
          branches={branches}
          actionButtons={
            currentFilter === 'active' 
            ? [
                {
                  id: 'show-qr-btn',
                  text: showQrCode ? t('coupons.hideMyQR') : t('coupons.showMyQR'),
                  icon: QrCode,
                  onClick: () => setShowQrCode(!showQrCode),
                  primary: false
                },
                {
                  id: 'scan-qr-btn',
                  text: t('coupons.scanStoreQR'),
                  icon: ScanLine,
                  onClick: () => navigate(`/scanner?deal_id=${selectedCoupon.deal_id}`),
                  primary: true
                }
              ] 
            : []
          }
        />
      )}
    </div>
  );
}
