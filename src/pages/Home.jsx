import { useEffect, useState, useRef, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, RefreshCcw, AlertTriangle, Loader2, Search, X, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        discount_type: detail?.discount_type || 'percentage',
        discount_value: detail?.discount_value,
        tenant_name: tenant?.name || 'Business',
        tenant_logo: tenant?.logo_url?.replace('via.placeholder.com', 'placehold.co'),
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

  const claimDeal = async (deal) => {
    if (!user) { navigate('/login'); return; }
    setClaimingId(deal.deal_id);
    try {
      const qrCode = `RG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const { error: claimError } = await supabase.from('coupons').insert({
        deal_id: deal.deal_id,
        tenant_id: deal.tenant_id,
        user_id: user.id,
        qr_code: qrCode,
        status: 'pending'
      });
      if (claimError) throw claimError;
      navigate('/coupons');
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
        <MapPin size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{t('home.checkingAccess')}</p>
      </div>
    );
  }

  // Waiting for browser to return coords
  if (permissionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-[28px] flex items-center justify-center mb-6 border border-brand-primary/20">
          <Loader2 size={32} className="text-brand-primary animate-spin" />
        </div>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{t('home.retrievingLocation')}</p>
      </div>
    );
  }

  // First-time visit — show branded rationale before triggering browser prompt
  if (permissionStatus === 'prompt') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-[48px] border border-white/20 shadow-2xl overflow-hidden relative">
          {/* Top decorative gradient */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary opacity-80"></div>

          <div className="p-10 text-center">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-primary/30">
              <Navigation size={44} className="text-white" fill="currentColor" />
            </div>

            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              {t('home.enableLocationBtn')}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed font-medium mb-10">
              {t('home.locationRationaleDesc')}
            </p>

            <button
              onClick={requestLocation}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black py-5 rounded-[28px] shadow-xl shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <MapPin size={20} />
              {t('home.enableLocationBtn')}
            </button>

            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-6">
              You can change this anytime in browser settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission permanently denied — guide user to browser settings
  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-sm bg-red-500/10 backdrop-blur-xl rounded-[48px] border border-red-500/20 shadow-2xl overflow-hidden p-10 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <h3 className="font-black text-white text-xl mb-3">{t('home.accessDeniedTitle')}</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            {t('home.accessDeniedDesc')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-black py-5 rounded-[28px] hover:bg-red-500/30 transition-all active:scale-95 text-sm uppercase tracking-widest"
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
          <h2 className="text-3xl font-black text-white tracking-tight">{t('home.activeDeals')}</h2>
          <p className="text-sm text-white/60 font-medium">{t('home.subtitle')}</p>
        </div>
        <button 
          onClick={() => coords && fetchNearbyDeals(coords.latitude, coords.longitude)}
          disabled={loading}
          className="p-3 bg-white/5 text-brand-primary hover:bg-white/10 rounded-full transition-all disabled:opacity-50 border border-white/10"
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-primary transition-colors" size={20} />
          <input 
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-white placeholder:text-white/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
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
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategory === cat 
                ? 'bg-white text-brand-secondary shadow-lg' 
                : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
              }`}
            >
              {cat === 'All' ? t('home.all') : t('db_categories.' + cat, { defaultValue: cat })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {filteredDeals.length === 0 && !loading ? (
          <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] py-20 text-center px-10 backdrop-blur-md">
            <div className="w-20 h-20 bg-white/5 text-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('home.noDealsFound')}</h3>
            <p className="text-white/40 text-sm leading-relaxed">
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
          filteredDeals.map((deal, idx) => (
            <div 
              key={`${deal.deal_id}-${deal.branch_name || idx}`}
              onClick={() => claimDeal(deal)}
              className="bg-white/10 backdrop-blur-lg rounded-[32px] shadow-xl border border-white/20 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-inner flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                       {deal.tenant_logo ? (
                         <img src={deal.tenant_logo} alt="Logo" className="w-full h-full object-contain" />
                       ) : (
                        <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center">
                           <Tag size={24} className="text-brand-primary" />
                         </div>
                       )}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{deal.tenant_name}</p>
                      <h3 className="font-extrabold text-white text-xl leading-snug group-hover:text-brand-primary transition-colors">
                        {deal.deal_title}
                      </h3>
                      <p className="text-white/60 text-xs font-medium flex items-center gap-1.5 mt-1.5">
                        <MapPin size={12} className="text-brand-primary" />
                        {deal.branch_name}
                      </p>
                    </div>
                  </div>
                  <span className="bg-white text-brand-secondary text-[10px] uppercase font-black px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg">
                    {Math.round(deal.distance / 100) / 10}km
                  </span>
                </div>
                
                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col items-start min-w-0 pr-3">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t('home.offer')}</span>
                    <span className="text-lg font-black text-white truncate w-full">{t('home.saveBig')}</span>
                  </div>
                  <button 
                    disabled={claimingId === deal.deal_id}
                    className="flex-shrink-0 whitespace-nowrap bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black px-6 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2 border border-white/10"
                  >
                    {claimingId === deal.deal_id ? (
                      <><Loader2 size={20} className="animate-spin text-brand-primary" /> Claiming...</>
                    ) : (
                      t('home.claimDeal')
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More / End of List */}
      {!loading && deals.length > 0 && (
        <div className="flex justify-center pb-4">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/15 transition-all active:scale-95 disabled:opacity-50"
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
    </div>
  );
}
