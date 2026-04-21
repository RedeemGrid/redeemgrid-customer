import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, RefreshCcw, AlertTriangle, Search, X, Navigation, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PermissionGuide from '@/components/PermissionGuide';
import OfferDetailModal from '@/components/OfferDetailModal';
import SafeImage from '@/components/SafeImage';
import { DealCardSkeleton } from '@/components/Skeleton';
import { DealService } from '@/services/dealService';
import { CouponService } from '@/services/couponService';
import type { EnrichedDeal, Branch } from '@/types/models';
import { ConflictError } from '@/lib/errors';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePreferences } from '@/context/PreferencesContext';
import { formatDistance } from '@/lib/distanceUtils';

const PAGE_SIZE = 20;

const STORAGE_KEYS = {
  LAST_DEALS: 'rg_last_known_deals',
  LAST_COORDS: 'rg_last_known_coords'
};

// Helper for distance calculation (Haversine formula)
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface DealCardProps {
  deal: EnrichedDeal;
  isClaimed: boolean;
  onClick: () => void;
  t: any;
}

const DealCard = ({ deal, isClaimed, onClick, t }: DealCardProps) => {
  const { distanceUnit } = usePreferences();
  const endDateString = deal.end_date ? new Date(deal.end_date).toLocaleDateString() : null;
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[32px] shadow-premium hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500 group cursor-pointer flex flex-col h-full relative"
    >
      <div className="relative h-44 w-full bg-neutral-100 rounded-t-[32px] overflow-hidden">
        <SafeImage
          src={deal.image_url}
          alt=""
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          placeholder={
            <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex flex-col items-center justify-center text-neutral-300">
              <Tag size={40} strokeWidth={1} className="opacity-20 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Nabbu</p>
            </div>
          }
        />

        <div className="absolute top-6 left-6 z-10">
          <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-lg border border-black/5 flex items-center gap-2">
            {deal.deal_title?.includes('%') ? (
              <>
                <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                <span className="text-[11px] font-black text-text-main uppercase tracking-wider">
                  {deal.deal_title.match(/\d+%/)?.[0]}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Tag size={12} className="text-brand-primary" />
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-tighter">Nabbu</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <div className="bg-brand-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg shadow-brand-primary/20">
            {t(`db_categories.${deal.category.charAt(0).toUpperCase() + deal.category.slice(1).toLowerCase()}`, { defaultValue: deal.category })}
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 border border-black/5 overflow-hidden flex-shrink-0">
              {deal.tenant_logo ? (
                <img src={deal.tenant_logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-brand-primary/5 flex items-center justify-center text-brand-primary font-bold text-xs">
                  {deal.tenant_name?.[0] || 'N'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.15em] mb-0.5">{deal.tenant_name}</p>
              <div className="flex items-center gap-2">
                <span className="text-brand-secondary text-[10px] font-black bg-brand-secondary/5 px-2 py-0.5 rounded-md">
                  {formatDistance(deal.distance, distanceUnit, t)}
                </span>
                {endDateString && (
                  <p className="text-text-muted text-[10px] font-bold flex items-center gap-1">
                    <Clock size={10} /> {endDateString}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-text-main text-xl leading-snug group-hover:text-brand-primary transition-colors mb-4 line-clamp-2">
          {deal.deal_title}
        </h3>

        <div className="mt-auto pt-5 border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-muted">
            <MapPin size={12} className="text-brand-primary" />
            <span className="text-[11px] font-bold truncate max-w-[140px] uppercase tracking-tighter">{deal.branch_name}</span>
          </div>
          <div className={`flex-shrink-0 rounded-full font-black px-6 py-2.5 transition-all text-[11px] uppercase tracking-wider ${
            isClaimed
              ? 'bg-brand-primary/5 text-brand-primary'
              : 'bg-brand-secondary text-white shadow-md shadow-brand-secondary/20'
          }`}>
            {isClaimed ? t('home.viewOffer') : t('home.viewDetails')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { t } = useTranslation();
  const { permissionStatus, coords, requestLocation } = useGeolocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const { radiusInMeters } = usePreferences();

  // ── State ────────────────────────────────────────────────────────────────────
  const [pageOffset, setPageOffset] = useState(0);
  const [allDeals, setAllDeals] = useState<EnrichedDeal[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
  const [dealBranches, setDealBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isUsingCachedLocation, setIsUsingCachedLocation] = useState(false);

  // ── Initialization from Cache ────────────────────────────────────────────────
  useState(() => {
    try {
      const savedDeals = localStorage.getItem(STORAGE_KEYS.LAST_DEALS);
      if (savedDeals) {
        setAllDeals(JSON.parse(savedDeals));
        setIsUsingCachedLocation(true);
      }
    } catch (e) {
      console.error('Failed to load cached deals', e);
    }
  });

  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // ── React Query: Nearby Deals ────────────────────────────────────────────────
  const { isLoading, isError, refetch } = useQuery({
    queryKey: ['nearby-deals', coords?.latitude, coords?.longitude, radiusInMeters],
    queryFn: async () => {
      if (!coords) return { deals: allDeals, hasMore: false };

      const { latitude: lat, longitude: lng } = coords;

      // Distance check to determine if we should show skeletons or just update in background
      const savedCoordsStr = localStorage.getItem(STORAGE_KEYS.LAST_COORDS);
      if (savedCoordsStr) {
        const savedCoords = JSON.parse(savedCoordsStr);
        const distance = getDistanceInKm(lat, lng, savedCoords.lat, savedCoords.lng);
        // If moved more than 1km, we treat it as a new location
        if (distance > 1) {
          if (isUsingCachedLocation) {
            setAllDeals([]); // Wipe cache to show skeletons
            setIsUsingCachedLocation(false);
          }
        }
      }

      // Guard: skip if coords unchanged
      if (
        lastFetchedCoordsRef.current?.lat === lat &&
        lastFetchedCoordsRef.current?.lng === lng &&
        allDeals.length > 0
      ) {
        return { deals: allDeals, hasMore };
      }

      lastFetchedCoordsRef.current = { lat, lng };
      const result = await DealService.getNearbyDeals(lat, lng, radiusInMeters, PAGE_SIZE, 0);
      
      // Update cache
      localStorage.setItem(STORAGE_KEYS.LAST_DEALS, JSON.stringify(result.deals));
      localStorage.setItem(STORAGE_KEYS.LAST_COORDS, JSON.stringify({ lat, lng }));
      setIsUsingCachedLocation(false);

      setPageOffset(0);
      setHasMore(result.hasMore);
      setAllDeals(result.deals);
      return result;
    },
    enabled: permissionStatus === 'ready' && !!coords,
  });

  // ── React Query: User Coupons Map ────────────────────────────────────────────
  const { data: userCoupons = {} } = useQuery({
    queryKey: ['user-coupons-map', user?.id],
    queryFn: () => CouponService.getUserCouponsMap(user!.id),
    enabled: !!user,
  });

  // ── Load More ────────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!coords || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const newOffset = pageOffset + PAGE_SIZE;
    try {
      const result = await DealService.getNearbyDeals(coords.latitude, coords.longitude, radiusInMeters, PAGE_SIZE, newOffset);
      setPageOffset(newOffset);
      setHasMore(result.hasMore);
      setAllDeals(prev => [...prev, ...result.deals]);
    } finally {
      setIsFetchingMore(false);
    }
  }, [coords, isFetchingMore, hasMore, pageOffset]);

  // ── Fetch Branches for Modal ─────────────────────────────────────────────────
  const fetchDealBranches = async (tenantId: string) => {
    try {
      const branches = await DealService.getTenantBranches(tenantId);
      setDealBranches(branches);
    } catch {
      setDealBranches([]);
    }
  };

  const handleSelectDeal = (deal: EnrichedDeal) => {
    setSelectedDeal(deal);
    if (deal.tenant_id) fetchDealBranches(deal.tenant_id);
    else setDealBranches([]);
  };

  // ── Claim Deal ───────────────────────────────────────────────────────────────
  const claimDeal = async (deal: EnrichedDeal) => {
    if (!user) { navigate('/login'); return; }

    if (userCoupons[deal.deal_id]) {
      navigate(`/coupons?id=${userCoupons[deal.deal_id].id}`);
      return;
    }

    setClaimingId(deal.deal_id);
    try {
      const coupon = await CouponService.claimDeal(user.id, deal);
      queryClient.invalidateQueries({ queryKey: ['user-coupons-map', user.id] });
      navigate(`/coupons?id=${coupon.id}`);
    } catch (err) {
      if (err instanceof ConflictError) {
        alert(t('home.alreadyClaimed') || 'You have already claimed this deal!');
      } else {
        alert('Failed to claim deal. Please try again.');
      }
    } finally {
      setClaimingId(null);
    }
  };

  // ── Derived State ────────────────────────────────────────────────────────────
  const availableCategories = ['All', ...new Set(allDeals.map(d => d.category))];

  const filteredDeals = allDeals.filter(d => {
    const matchCat = activeCategory === 'All' || d.category === activeCategory;
    const matchSearch = !searchQuery ||
      d.deal_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.branch_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistance = d.distance <= radiusInMeters;
    return matchCat && matchSearch && matchDistance;
  });

  // ── Geo Permission States ────────────────────────────────────────────────────
  const showSkeletons = permissionStatus === 'idle' || permissionStatus === 'checking' || permissionStatus === 'loading';



  if (permissionStatus === 'prompt') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden relative">
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-primary">
              <Navigation size={44} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-text-main mb-3 tracking-tight">{t('home.locationRationaleTitle')}</h2>
            <p className="text-text-muted text-sm leading-relaxed font-medium mb-10">{t('home.locationRationaleDesc')}</p>
            <button
              onClick={requestLocation}
              className="w-full bg-brand-secondary text-white font-black py-5 rounded-full shadow-lg shadow-brand-secondary/20 hover:bg-brand-primary active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <MapPin size={20} />
              {t('home.enableLocationBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 max-w-lg mx-auto animate-in fade-in duration-500">
        <PermissionGuide type="location" onAlreadyFixed={() => window.location.reload()} />
      </div>
    );
  }

  if (permissionStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden p-10 text-center">
          <div className="w-20 h-20 bg-status-error-bg rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <RefreshCcw size={36} className="text-status-error" />
          </div>
          <h3 className="font-black text-text-main text-xl mb-3">{t('home.errorLocationTitle')}</h3>
          <p className="text-text-muted text-sm leading-relaxed mb-8">
            {t('home.errorLocationDesc')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 rounded-[28px] hover:opacity-90 transition-all active:scale-95 text-sm uppercase tracking-widest shadow-xl shadow-brand-primary/20"
          >
            {t('home.retryCheckBtn')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main Content ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">{t('home.activeDeals')}</h2>
          <p className="text-sm text-text-muted font-medium">{t('home.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-3 bg-white text-brand-primary hover:bg-brand-primary/5 rounded-full transition-all disabled:opacity-50 border border-black/5 shadow-sm"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {isError && (
        <div className="bg-status-error-bg border border-status-error/20 p-4 rounded-2xl text-status-error text-sm flex items-center gap-3">
          <AlertTriangle size={18} />
          {t('home.errorFetchDeals')}
        </div>
      )}

      {/* Loading Overlay for Cached Data */}
      {showSkeletons && allDeals.length > 0 && (
        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl px-5 py-4 mb-6 animate-in fade-in slide-in-from-top-2 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
            <Clock size={20} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-brand-primary">
              {t('home.showingLastKnown')}
            </p>
            <p className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-tighter mt-0.5">
              {t('home.retrievingLocation')}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-brand-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-medium text-text-main placeholder:text-text-muted/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-main"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                activeCategory === cat
                ? 'bg-brand-primary text-white border-transparent shadow-lg'
                : 'bg-white text-text-muted border-black/5 hover:border-black/10'
              }`}
            >
              {cat === 'All' ? t('home.all') : t('db_categories.' + cat, { defaultValue: cat })}
            </button>
          ))}
        </div>
      </div>

      {/* Deal Grid */}
      <div className="grid gap-6">
        {showSkeletons && allDeals.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <DealCardSkeleton key={i} />)
        ) : isLoading && allDeals.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <DealCardSkeleton key={i} />)
        ) : filteredDeals.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black/5 rounded-[40px] py-20 text-center px-10 shadow-sm">
            <div className="w-20 h-20 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">{t('home.noDealsFound')}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{t('home.noDealsFound')}</p>
            {(searchQuery || activeCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-6 text-brand-primary font-bold text-sm hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <DealCard 
              key={`${deal.deal_id}-${deal.branch_name}`} 
              deal={deal} 
              isClaimed={!!userCoupons[deal.deal_id]}
              onClick={() => handleSelectDeal(deal)}
              t={t}
            />
          ))
        )}
      </div>

      {!isLoading && allDeals.length > 0 && (
        <div className="flex justify-center pb-4 mt-8">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="flex items-center gap-3 px-8 py-4 bg-white border border-black/5 text-text-main font-bold rounded-full hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {isFetchingMore ? (
                <><RefreshCcw size={18} className="animate-spin text-brand-primary" /> {t('home.loadingMore')}</>
              ) : (
                <><RefreshCcw size={18} className="text-brand-primary" /> {t('home.loadMore')}</>
              )}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-8 h-px bg-black/10"></div>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">{t('home.noMoreDeals')}</p>
              <div className="w-8 h-px bg-black/10"></div>
            </div>
          )}
        </div>
      )}

      {selectedDeal && (
        <OfferDetailModal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          tenantName={selectedDeal.tenant_name}
          tenantLogo={selectedDeal.tenant_logo}
          title={selectedDeal.deal_title}
          description={selectedDeal.description}
          imageUrl={selectedDeal.image_url}
          endDate={selectedDeal.end_date}
          category={selectedDeal.category}
          branches={(dealBranches && dealBranches.length > 0) ? dealBranches : [{ branch_name: selectedDeal.branch_name }]}
          actionButtons={[
            {
              id: 'claim-btn',
              text: userCoupons[selectedDeal.deal_id] ? t('home.viewCoupon') : (isOnline ? t('home.claimDeal') : t('offline.requiresConnection')),
              onClick: () => claimDeal(selectedDeal),
              disabled: !isOnline || claimingId === selectedDeal.deal_id || userCoupons[selectedDeal.deal_id]?.status === 'redeemed',
              loading: claimingId === selectedDeal.deal_id,
              primary: !!isOnline,
              icon: Tag,
            }
          ]}
        />
      )}
    </div>
  );
}
