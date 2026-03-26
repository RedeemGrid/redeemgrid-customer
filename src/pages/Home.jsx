import { useEffect, useState, useRef, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, RefreshCcw, AlertTriangle, Loader2, Search, X, Navigation, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OfferDetailModal from '../components/OfferDetailModal';
import SafeImage from '../components/SafeImage';

const PAGE_SIZE = 20;

export default function Home() {
  const { t } = useTranslation();
  const { permissionStatus, coords, error: geoError, requestLocation } = useGeolocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deals, setDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealBranches, setDealBranches] = useState([]);
  const [userCoupons, setUserCoupons] = useState({}); // Track claimed status: { dealId: couponId }
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [availableCategories, setAvailableCategories] = useState(['All']);

  // Cache lookup tables — fetched once, never re-fetched on load more
  const catsMapRef = useRef(null);

  const enrichDeals = useCallback((rawDeals, detailsData) => {
    const detailsMap = detailsData.reduce((acc, d) => { acc[d.id] = d; return acc; }, {});
    return rawDeals.map(d => {
      const detail = detailsMap[d.deal_id];
      const tenant = detail?.tenant;
      return {
        ...d,
        category: detail?.category_id ? (catsMapRef.current[detail.category_id] || 'Other') : 'Other',
        tenant_id: detail?.tenant_id,
        discount_value: detail?.discount_value,
        tenant_name: tenant?.name || 'Business',
        tenant_logo: tenant?.logo_url?.replace('via.placeholder.com', 'placehold.co'),
        end_date: detail?.end_date,
        image_url: detail?.image_url,
        description: detail?.description,
      };
    });
  }, []);

  const fetchNearbyDeals = useCallback(async (lat, lng, offset = 0, isLoadMore = false) => {
    if (isLoadMore) setIsFetchingMore(true);
    else { setLoading(true); setError(null); }

    try {
      const { data: rawDeals, error: rpcError } = await supabase.rpc('get_nearby_branches', {
        lat,
        lng,
        radius_meters: 50000,
        page_size: PAGE_SIZE,
        page_offset: offset,
      });

      if (rpcError) throw rpcError;

      if (!rawDeals || rawDeals.length === 0) {
        setHasMore(false);
        if (!isLoadMore) { setDeals([]); setFilteredDeals([]); }
        return;
      }

      // Determine if more pages exist
      setHasMore(rawDeals.length === PAGE_SIZE);

      // Fetch lookup tables only once per session
      if (!catsMapRef.current) {
        const { data: catsRes } = await supabase.from('categories').select('*');
        catsMapRef.current = (catsRes || []).reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {});
      }

      // Fetch deal details for this page only
      const dealIds = [...new Set(rawDeals.map(d => d.deal_id))];
      const { data: detailsData, error: detailsErr } = await supabase
        .from('deals').select('*, tenant:tenant_id(*)').in('id', dealIds);
      if (detailsErr) console.error('Details fetch error:', detailsErr);

      const enrichedDeals = enrichDeals(rawDeals, detailsData || []);

      if (isLoadMore) {
        setDeals(prev => {
          const allDeals = [...prev, ...enrichedDeals];
          const uniqueCats = ['All', ...new Set(allDeals.map(d => d.category))];
          setAvailableCategories(uniqueCats);
          return allDeals;
        });
      } else {
        const uniqueCats = ['All', ...new Set(enrichedDeals.map(d => d.category))];
        setAvailableCategories(uniqueCats);
        setDeals(enrichedDeals);
        setFilteredDeals(enrichedDeals);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Could not fetch deals in your area.');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [enrichDeals]);

  const loadMore = useCallback(() => {
    if (!coords || isFetchingMore || !hasMore) return;
    const newOffset = pageOffset + PAGE_SIZE;
    setPageOffset(newOffset);
    fetchNearbyDeals(coords.latitude, coords.longitude, newOffset, true);
  }, [coords, isFetchingMore, hasMore, pageOffset, fetchNearbyDeals]);

  const fetchUserCoupons = async () => {
    if (!user) return;
    const { data } = await supabase.from('coupons').select('id, deal_id, status').eq('user_id', user.id);
    if (data) {
      const cmap = {};
      data.forEach(c => { cmap[c.deal_id] = { id: c.id, status: c.status }; });
      setUserCoupons(cmap);
    }
  };

  useEffect(() => {
    fetchUserCoupons();
  }, [user]);

  const fetchDealBranches = async (tenantId) => {
    const { data } = await supabase.from('branches').select('*').eq('tenant_id', tenantId);
    if (data && coords) {
      // Calculate basic distance using Haversine if needed, or just append the distance from the original deal query if it's the only one. 
      // For simplicity, we just pass the branches, distances can be handled later or omitted if not critical.
      setDealBranches(data);
    } else {
      setDealBranches(data || []);
    }
  };

  useEffect(() => {
    if (selectedDeal?.tenant_id) {
      fetchDealBranches(selectedDeal.tenant_id);
    } else {
      setDealBranches([]);
    }
  }, [selectedDeal]);

  const claimDeal = async (deal) => {
    if (!user) { navigate('/login'); return; }
    
    // If already claimed, act as 'View Coupon'
    if (userCoupons[deal.deal_id]) {
      navigate(`/coupons?id=${userCoupons[deal.deal_id].id}`);
      return;
    }

    setClaimingId(deal.deal_id);
    try {
      const qrCode = `RG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const { data, error: claimError } = await supabase.from('coupons').insert({
        deal_id: deal.deal_id,
        tenant_id: deal.tenant_id,
        user_id: user.id,
        qr_code: qrCode,
        status: 'pending'
      }).select().single();
      if (claimError) throw claimError;
      
      setUserCoupons(prev => ({ ...prev, [deal.deal_id]: { id: data.id, status: 'pending' } }));
      navigate(`/coupons?id=${data.id}`);
    } catch (err) {
      console.error('Error claiming deal:', err);
      if (err.code === '23505') {
        alert(t('home.alreadyClaimed') || 'You have already claimed this deal!');
      } else {
        alert('Failed to claim deal. Please try again.');
      }
    } finally {
      setClaimingId(null);
    }
  };

  // Reset and reload when location becomes available
  useEffect(() => {
    if (permissionStatus === 'ready' && coords) {
      setPageOffset(0);
      setHasMore(false);
      catsMapRef.current = null; // reset cache on fresh location
      fetchNearbyDeals(coords.latitude, coords.longitude, 0, false);
    }
  }, [permissionStatus, coords]);

  useEffect(() => {
    let result = deals;
    
    if (activeCategory !== 'All') {
      result = result.filter(d => d.category === activeCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.deal_title.toLowerCase().includes(q) || 
        d.branch_name.toLowerCase().includes(q)
      );
    }
    
    setFilteredDeals(result);
  }, [searchQuery, activeCategory, deals]);

  // --- Permission state render branches ---

  // Checking existing permission silently — minimal spinner
  if (permissionStatus === 'idle' || permissionStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <MapPin size={48} className="text-text-muted/20 mb-4" />
        <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">{t('home.checkingAccess')}</p>
      </div>
    );
  }

  // Waiting for browser to return coords
  if (permissionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-brand-primary/5 rounded-[28px] flex items-center justify-center mb-6 border border-brand-primary/10">
          <Loader2 size={32} className="text-brand-primary animate-spin" />
        </div>
        <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">{t('home.retrievingLocation')}</p>
      </div>
    );
  }

   // First-time visit — show branded rationale before triggering browser prompt
  if (permissionStatus === 'prompt') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden relative">
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-primary">
              <Navigation size={44} fill="currentColor" />
            </div>

            <h2 className="text-2xl font-black text-text-main mb-3 tracking-tight">
              {t('home.locationRationaleTitle')}
            </h2>
            <p className="text-text-muted text-sm leading-relaxed font-medium mb-10">
              {t('home.locationRationaleDesc')}
            </p>

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

  // Permission permanently denied — guide user to browser settings
  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden p-10 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={36} className="text-red-500" />
          </div>
          <h3 className="font-black text-text-main text-xl mb-3">{t('home.accessDeniedTitle')}</h3>
          <p className="text-text-muted text-sm leading-relaxed mb-8">
            {t('home.accessDeniedDesc')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 text-white font-black py-5 rounded-full shadow-lg shadow-red-500/20 hover:opacity-90 transition-all active:scale-95 text-sm uppercase tracking-widest"
          >
            {t('home.retryCheckBtn')}
          </button>
        </div>
      </div>
    );
  }

  // Generic geolocation error (timeout, unsupported, etc.) — show retry
  if (permissionStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden p-10 text-center">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-brand-primary/20">
            <RefreshCcw size={36} className="text-brand-primary" />
          </div>
          <h3 className="font-black text-white text-xl mb-3">Couldn't Get Location</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            There was a problem getting your location. This can happen on slow connections or GPS timeouts. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 rounded-[28px] hover:opacity-90 transition-all active:scale-95 text-sm uppercase tracking-widest shadow-xl shadow-brand-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">{t('home.activeDeals')}</h2>
          <p className="text-sm text-text-muted font-medium">{t('home.subtitle')}</p>
        </div>
        <button 
          onClick={() => coords && fetchNearbyDeals(coords.latitude, coords.longitude)}
          disabled={loading}
          className="p-3 bg-white text-brand-primary hover:bg-brand-primary/5 rounded-full transition-all disabled:opacity-50 border border-black/5 shadow-sm"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3 backdrop-blur-md">
          <AlertTriangle size={18} />
          {error}
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

      <div className="grid gap-6">
        {filteredDeals.length === 0 && !loading ? (
          <div className="bg-white border-2 border-dashed border-black/5 rounded-[40px] py-20 text-center px-10 shadow-sm">
            <div className="w-20 h-20 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">{t('home.noDealsFound')}</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {t('home.noDealsFound')}
            </p>
            { (searchQuery || activeCategory !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-6 text-brand-primary font-bold text-sm hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredDeals.map((deal, idx) => {
            const isClaimed = !!userCoupons[deal.deal_id];
            // Format end_date if present
            const endDateString = deal.end_date ? new Date(deal.end_date).toLocaleDateString() : null;

            return (
              <div 
                key={`${deal.deal_id}-${deal.branch_name || idx}`}
                onClick={() => setSelectedDeal(deal)}
                className="bg-white rounded-[32px] shadow-premium hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500 group cursor-pointer flex flex-col h-full relative"
              >
                {/* Hero Image Section */}
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
                  
                  {/* Floating Hook Label */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-lg border border-black/5 flex items-center gap-2">
                      {deal.deal_title?.includes('%') ? (
                        <>
                          <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                          <span className="text-[11px] font-black text-text-main uppercase tracking-wider">
                            {deal.deal_title.match(/\d+%/)[0]}
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

                  {/* Corner Category Tag */}
                  <div className="absolute top-4 right-4 z-10">
                     <div className="bg-brand-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg shadow-brand-primary/20">
                        {t(`db_categories.${deal.category.charAt(0).toUpperCase() + deal.category.slice(1).toLowerCase()}`) || deal.category}
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
                              {Math.round(deal.distance / 100) / 10}km
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
                    <div 
                      className={`flex-shrink-0 rounded-full font-black px-6 py-2.5 transition-all text-[11px] uppercase tracking-wider ${
                        isClaimed 
                          ? 'bg-brand-primary/5 text-brand-primary' 
                          : 'bg-brand-secondary text-white shadow-md shadow-brand-secondary/20 transition-all'
                      }`}
                    >
                      {isClaimed ? t('home.viewOffer') : t('home.viewDetails')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More / End of List */}
      {!loading && deals.length > 0 && (
        <div className="flex justify-center pb-4">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="flex items-center gap-3 px-8 py-4 bg-white border border-black/5 text-text-main font-bold rounded-full hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {isFetchingMore ? (
                <><Loader2 size={18} className="animate-spin text-brand-primary" /> {t('home.loadingMore')}</>
              ) : (
                <><RefreshCcw size={18} className="text-brand-primary" /> {t('home.loadMore')}</>
              )}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-8 h-px bg-white/20"></div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{t('home.noMoreDeals')}</p>
              <div className="w-8 h-px bg-white/20"></div>
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
          branches={(dealBranches && dealBranches.length > 0) ? dealBranches : [{ branch_name: selectedDeal.branch_name, ...selectedDeal }]}
          actionButtons={[
            {
              id: 'claim-btn',
              text: userCoupons[selectedDeal.deal_id] ? t('home.viewCoupon') : t('home.claimDeal'),
              onClick: () => claimDeal(selectedDeal),
              disabled: claimingId === selectedDeal.deal_id || userCoupons[selectedDeal.deal_id]?.status === 'redeemed',
              loading: claimingId === selectedDeal.deal_id,
              primary: true,
              icon: Tag
            }
          ]}
        />
      )}
    </div>
  );
}
