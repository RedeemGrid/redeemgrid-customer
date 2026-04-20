// @ts-nocheck
import { useEffect, useState } from 'react';
import { X, MapPin, Navigation, Clock, Loader2, QrCode, ChevronDown, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import SafeImage from './SafeImage';

export default function OfferDetailModal({
  isOpen,
  onClose,
  
  // View mode
  isCoupon = false, // If true, shows claimed date and qr code/scanner actions differently
  
  // Data
  tenantName,
  tenantLogo,
  title,
  description,
  imageUrl, // if null, handled gracefully
  category,
  endDate,
  claimedDate,
  qrCode,
  showQrCode = false,
  branches = [],
  
  // Actions
  actionButtons = [] // array of { id, text, icon: Icon, onClick, disabled, loading, primary }
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isBranchesOpen, setIsBranchesOpen] = useState(false);

  if (!isOpen) return null;

  const getTimeRemaining = (dateStr) => {
    if (!dateStr) return null;
    const total = Date.parse(dateStr) - Date.parse(new Date());
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (total <= 0) return null;
    if (days > 0) return `${days} ${t('coupons.daysLeft') || 'd'}`;
    return `${hours} ${t('coupons.hoursLeft') || 'h'}`;
  };

  const remaining = getTimeRemaining(endDate);
  const isExpiringSoon = remaining?.includes('h');
  const [showFullDesc, setShowFullDesc] = useState(false);

  const DESC_LIMIT = 150;
  const isLongDesc = description && description.length > DESC_LIMIT;
  const displayedDesc = (isLongDesc && !showFullDesc) 
    ? description.substring(0, DESC_LIMIT) + '...' 
    : description;

  const openInMaps = (branch) => {
    if (!branch.location) return;
    let query = branch.location;

    // Decode PostGIS EWKB (Extended WKB) hex string to lat,lng
    if (typeof query === 'string' && query.startsWith('0101000020E6100000') && query.length === 50) {
      try {
        const hexX = query.substring(18, 34);
        const hexY = query.substring(34, 50);
        
        const getFloat64 = (hex) => {
          const buffer = new ArrayBuffer(8);
          const view = new DataView(buffer);
          for(let i=0; i<8; i++) {
              view.setUint8(i, parseInt(hex.substring(i*2, i*2+2), 16));
          }
          return view.getFloat64(0, true); // true for little endian
        };
        
        const lng = getFloat64(hexX);
        const lat = getFloat64(hexY);
        query = `${lat},${lng}`;
      } catch (e) {
        console.error('Failed to parse location hex', e);
      }
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg rounded-t-[64px] shadow-22xl animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] flex flex-col relative">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-black/[0.08] rounded-full mx-auto mt-4 mb-2"></div>
        
        <div className="p-8 pb-10 relative flex-1 overflow-y-auto scrollbar-hide">
          <button 
            onClick={onClose}
            className="absolute right-8 top-8 z-10 p-2.5 bg-neutral-100 text-text-muted hover:text-text-main rounded-full transition-all border border-black/5"
          >
           <X size={22} />
          </button>
          
          {/* Header Info */}
          <div className="flex items-center gap-5 mb-8 pt-4">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-premium border border-black/5 flex items-center justify-center p-2 relative z-10">
              {tenantLogo ? (
                <img src={tenantLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center rounded-2xl text-brand-primary font-black">
                  {tenantName?.[0] || 'N'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-black uppercase tracking-[0.2em] mb-1">{tenantName}</p>
              <h3 className="text-2xl font-black text-text-main leading-tight">{title}</h3>
            </div>
          </div>

          {/* Offer Image Section */}
          <div className="relative w-full h-[300px] bg-neutral-100 rounded-[44px] mb-8 overflow-hidden shadow-premium">
            <SafeImage 
              src={imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex flex-col items-center justify-center text-neutral-300">
                  <Tag size={64} strokeWidth={1} className="opacity-10 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Nabbu Deal</p>
                </div>
              }
            />
            
            {/* Floating Hook Badge */}
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-white px-5 py-2.5 rounded-2xl shadow-xl border border-black/5 flex items-center gap-2">
                {title?.includes('%') ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-brand-secondary rounded-full"></div>
                    <span className="text-sm font-black text-text-main uppercase tracking-wider">
                      {title.match(/\d+%/)[0]}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-brand-primary" />
                    <span className="text-xs font-black text-brand-primary uppercase tracking-tighter">Nabbu</span>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Category Badge */}
            <div className="absolute top-6 right-6 z-10">
              <div className="bg-brand-primary text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                {category ? (t(`db_categories.${category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}`) || category) : 'Nabbu'}
              </div>
            </div>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {isCoupon && claimedDate ? (
              <div className="bg-neutral-50 p-5 rounded-[32px] border border-black/5">
                <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.claimedOn') || 'Reclamado'}</p>
                <p className="text-sm font-black text-text-main ml-1">{new Date(claimedDate).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="bg-brand-primary/5 p-5 rounded-[32px] border border-brand-primary/10">
                <p className="text-[9px] text-brand-primary font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('offerModal.status')}</p>
                <p className="text-sm font-black text-brand-primary ml-1">{t('offerModal.active')}</p>
              </div>
            )}
            
            <div className={`p-5 rounded-[32px] border ${isExpiringSoon ? 'bg-red-50 border-red-100' : 'bg-neutral-50 border-black/5'}`}>
              <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.validUntil')}</p>
              <p className={`text-sm font-black ml-1 ${isExpiringSoon ? 'text-red-500' : 'text-text-main'}`}>
                {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                {remaining && <span className="block text-[10px] font-black uppercase mt-1 opacity-60 tracking-wider">⚡ {remaining}</span>}
              </p>
            </div>
          </div>
          
          <div className="bg-neutral-50/50 p-6 rounded-[32px] border border-black/5 mb-8">
            <p className="text-text-main text-base leading-relaxed font-medium whitespace-pre-wrap">
              {displayedDesc}
            </p>
            {isLongDesc && (
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-4 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity flex items-center gap-1.5"
              >
                {showFullDesc ? t('common.showLess') || 'Mostrar Menos' : t('common.readMore') || 'Ver Más'}
                <div className={`w-1 h-1 bg-brand-primary rounded-full ${showFullDesc ? '' : 'animate-pulse'}`}></div>
              </button>
            )}
          </div>
          
          {/* QR Code Section */}
          {qrCode && showQrCode && (
            <div className="bg-neutral-50 p-8 rounded-[40px] text-center border border-black/5 shadow-sm mb-10 relative overflow-hidden group">
              <div className="relative inline-block group">
                <div className="absolute -inset-4 bg-brand-primary opacity-5 rounded-[40px] blur-lg group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative p-6 bg-white rounded-[36px] shadow-premium border border-black/5">
                  <QRCodeSVG 
                    value={qrCode} 
                    size={180} 
                    level="H"
                    className="mx-auto"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <code className="bg-white text-text-main px-8 py-3.5 rounded-full text-lg tracking-[0.3em] font-black border border-black/5 shadow-sm">
                  {qrCode}
                </code>
                <div className="mt-6 flex items-center gap-2 bg-brand-secondary/5 border border-brand-secondary/10 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary animate-pulse">
                  <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                  {t('offerModal.secureTokenActive')}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {actionButtons && actionButtons.length > 0 && (
            <div className="grid gap-3 mb-10">
              {actionButtons.map(btn => (
                <button 
                  key={btn.id}
                  onClick={btn.onClick}
                  disabled={btn.disabled || btn.loading}
                  className={`w-full font-black py-4 rounded-full transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm uppercase tracking-[0.1em] ${
                    btn.primary 
                      ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20 hover:bg-brand-primary'
                      : 'bg-neutral-100 text-text-main hover:bg-neutral-200'
                  } disabled:opacity-50`}
                >
                  {btn.loading ? <Loader2 size={20} className="animate-spin" /> : (btn.icon && <btn.icon size={20} />)}
                  {btn.text}
                </button>
              ))}
            </div>
          )}
          
          {/* Branches Section */}
          <div className="space-y-5">
            <button 
              onClick={() => setIsBranchesOpen(!isBranchesOpen)}
              className="w-full flex items-center justify-between font-black text-text-main text-sm uppercase tracking-[0.2em] group outline-none"
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-brand-primary" />
                {t('offerModal.applicableBranches')}
                <span className="bg-brand-primary/5 text-brand-primary text-[10px] px-2 py-0.5 rounded-full">
                  {branches.length}
                </span>
              </div>
              <ChevronDown size={20} className={`text-text-muted group-hover:text-text-main transition-transform ${isBranchesOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid gap-3 overflow-hidden transition-all duration-300 ${isBranchesOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none m-0'}`}>
              {branches.length > 0 ? branches.map(branch => (
                <div 
                  key={branch.id || branch.branch_id} 
                  onClick={() => openInMaps(branch)}
                  className="bg-neutral-50 p-5 rounded-3xl flex items-center justify-between group hover:bg-neutral-100 transition-all border border-black/5 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-text-main text-base">{branch.name || branch.branch_name}</p>
                    {branch.distance && (
                       <p className="text-[10px] text-brand-secondary font-bold uppercase mt-1">{t('offerModal.distanceAway', { val: Math.round(branch.distance / 100) / 10 })}</p>
                    )}
                    <p className="text-xs text-text-muted font-medium mt-1 uppercase tracking-tighter flex items-center gap-1.5 opacity-60">
                      <MapPin size={10} /> {t('offerModal.viewOnMap')}
                    </p>
                  </div>
                  <div className="bg-white text-brand-primary p-3.5 rounded-2xl hover:bg-brand-primary hover:text-white active:scale-90 transition-all shadow-sm border border-black/5">
                    <Navigation size={20} fill="currentColor" />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-text-muted italic px-1">{t('offerModal.loadingBranches')}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Close Button / Bottom Padding */}
        <div className="p-8 bg-neutral-100 border-t border-black/5">
          <button 
            onClick={onClose}
            className="w-full bg-white text-text-main font-black py-4 rounded-full hover:bg-neutral-50 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-black/5"
          >
            {t('offerModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

