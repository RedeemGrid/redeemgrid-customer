import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Ticket, Clock, CheckCircle, ChevronLeft, ScanLine, QrCode } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OfferDetailModal from '@/components/OfferDetailModal';
import SafeImage from '@/components/SafeImage';
import { CouponCardSkeleton } from '@/components/Skeleton';
import { CouponService } from '@/services/couponService';
import { DealService } from '@/services/dealService';
import type { Coupon, Branch } from '@/types/models';

export default function MyCoupons() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentFilter = searchParams.get('filter') || 'active';

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showQrCode, setShowQrCode] = useState(false);

  // ── React Query: User Coupons ────────────────────────────────────────────────
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['user-coupons', user?.id],
    queryFn: () => CouponService.getUserCoupons(user!.id),
    enabled: !!user,
  });

  // Invalidate and refetch when filter changes
  const handleFilterChange = (filter: string) => {
    setSearchParams({ filter });
    setActiveCategory('All');
    queryClient.invalidateQueries({ queryKey: ['user-coupons', user?.id] });
  };

  const fetchBranchesForCoupon = async (tenantId: string) => {
    try {
      const b = await DealService.getTenantBranches(tenantId);
      setBranches(b);
    } catch {
      setBranches([]);
    }
  };

  const handleSelectCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowQrCode(false);
    if (coupon.tenants?.id) fetchBranchesForCoupon(coupon.tenants.id);
    else setBranches([]);
  };

  // Deep-link: open a specific coupon when ?id= is in the URL.
  // Depends on searchParams so it fires both on fresh mount AND when
  // the user is already on this page and navigates here from a notification.
  const openedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const targetId = searchParams.get('id');
    // Guard: do nothing if no id, no coupons, or already opened this id
    if (!targetId || coupons.length === 0 || openedIdRef.current === targetId) return;

    const target = coupons.find(c => c.id === targetId);
    if (!target) return;

    // Mark as handled before any async/state calls to prevent double-open
    openedIdRef.current = targetId;
    handleSelectCoupon(target);

    // Remove ?id= from URL after a tick so it doesn't interfere with the render
    const timer = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      }, { replace: true });
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, coupons]);

  const now = new Date();

  const categories = ['All', ...new Set(coupons.map(c => c.categoryName || 'Other'))];

  const filteredCoupons = coupons.filter(c => {
    const isExpired = c.deals?.end_date && new Date(c.deals.end_date) < now;

    let match = false;
    if (currentFilter === 'redeemed') match = c.status === 'redeemed';
    else if (currentFilter === 'expired') match = c.status === 'pending' && !!isExpired;
    else match = c.status === 'pending' && !isExpired;

    if (!match) return false;
    if (activeCategory === 'All') return true;
    return c.categoryName === activeCategory;
  });

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const total = Date.parse(endDate) - Date.now();
    if (total <= 0) return null;
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days} ${t('coupons.daysLeft')}`;
    return `${hours} ${t('coupons.hoursLeft')}`;
  };

  if (!user && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-brand-primary/5 rounded-[32px] flex items-center justify-center mb-8 border border-brand-primary/10">
          <Ticket size={48} className="text-brand-primary opacity-40" />
        </div>
        <h2 className="text-2xl font-black text-text-main mb-3 tracking-tight">{t('coupons.title')}</h2>
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
            onClick={() => handleFilterChange(f)}
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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <CouponCardSkeleton key={i} />)
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black/5 rounded-[40px] py-20 text-center px-8 shadow-sm">
            <Ticket size={56} className="text-neutral-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-text-main mb-2">{t('coupons.noCouponsFound')}</h3>
            <p className="text-text-muted text-sm mb-8 max-w-xs mx-auto">{t('coupons.noCouponsFilter')}</p>
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
              onClick={() => handleSelectCoupon(coupon)}
              className={`bg-white rounded-[32px] shadow-premium border border-black/[0.03] overflow-hidden hover:shadow-card-hover hover:border-brand-primary/10 active:scale-[0.97] transition-all duration-300 cursor-pointer group flex flex-col h-full ${
                currentFilter !== 'active' ? 'grayscale opacity-70' : ''
              }`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
                <SafeImage
                  src={coupon.deals?.image_url}
                  alt={coupon.deals?.title || ''}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  placeholder={
                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                      <Ticket size={40} strokeWidth={1} className="animate-pulse" />
                    </div>
                  }
                />

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
                      <Clock size={12} className="text-status-warning" />
                      <span className="text-[9px] font-black text-status-warning uppercase tracking-tighter">
                        {getTimeRemaining(coupon.deals?.end_date)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/20">
                    <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mb-0.5">
                      {currentFilter === 'expired' ? t('coupons.expiredLabel') : t('coupons.claimedLabel')}
                    </p>
                    <p className="text-[10px] font-black text-text-main">
                      {new Date(currentFilter === 'expired' && coupon.deals?.end_date ? coupon.deals.end_date : coupon.created_at).toLocaleDateString()}
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
                        <div className="flex items-center gap-1 text-status-success">
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

      {selectedCoupon && (
        <OfferDetailModal
          isOpen={!!selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          isCoupon={true}
          tenantName={selectedCoupon.tenants?.name || ''}
          tenantLogo={selectedCoupon.tenants?.logo_url || ''}
          title={selectedCoupon.deals?.title || ''}
          description={selectedCoupon.deals?.description || ''}
          imageUrl={selectedCoupon.deals?.image_url || ''}
          endDate={selectedCoupon.deals?.end_date || ''}
          claimedDate={selectedCoupon.created_at}
          qrCode={selectedCoupon.qr_code}
          showQrCode={showQrCode}
          branches={(branches && branches.length > 0) ? branches : [] as any}
          actionButtons={
            currentFilter === 'active'
            ? [
                {
                  id: 'show-qr-btn',
                  text: showQrCode ? t('coupons.hideMyQR') : t('coupons.showMyQR'),
                  icon: QrCode,
                  onClick: () => setShowQrCode(!showQrCode),
                  primary: false,
                },
                {
                  id: 'scan-qr-btn',
                  text: t('coupons.scanStoreQR'),
                  icon: ScanLine,
                  onClick: () => navigate(`/scanner?deal_id=${selectedCoupon.deal_id}`),
                  primary: true,
                },
              ]
            : []
          }
        />
      )}
    </div>
  );
}
