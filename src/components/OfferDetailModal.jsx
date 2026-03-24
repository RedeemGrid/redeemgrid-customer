import { useState } from 'react';
import { X, MapPin, Navigation, Clock, Loader2, QrCode, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/60 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
      {/* Backdrop Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="bg-white/10 backdrop-blur-3xl w-full max-w-lg border-t border-white/20 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] flex flex-col relative isolate transform-gpu">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-6 mb-2"></div>
        
        <div className="p-8 relative flex-1 overflow-y-auto scrollbar-hide">
          <button 
            onClick={onClose}
            className="absolute right-8 top-8 z-10 p-2.5 bg-white/10 text-white/60 hover:text-white hover:bg-white/20 rounded-full transition-all border border-white/10"
          >
           <X size={22} />
          </button>
          
          {/* Header Info */}
          <div className="flex items-center gap-5 mb-8 pt-4">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center p-2">
              {tenantLogo ? (
                <img src={tenantLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center rounded-2xl">
                  {tenantName?.[0] || 'O'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">{tenantName}</p>
              <h3 className="text-2xl font-black text-white leading-tight">{title}</h3>
            </div>
          </div>

          {/* Optional Offer Image */}
          {imageUrl && (
            <div className="w-full h-48 bg-white/5 rounded-3xl mb-8 overflow-hidden shadow-inner border border-white/10">
              <img src={imageUrl} alt="Offer" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {isCoupon && claimedDate ? (
              <div className="bg-white/5 backdrop-blur-md p-5 rounded-[32px] border border-white/10 shadow-inner">
                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.claimedOn') || 'Reclamado'}</p>
                <p className="text-sm font-black text-white ml-1">{new Date(claimedDate).toLocaleDateString()}</p>
              </div>
            ) : (
              // If it's an offer, we can show a general "Active" or similar tile if needed, or just let dates span full if only one
              <div className="bg-brand-primary/10 backdrop-blur-md p-5 rounded-[32px] border border-brand-primary/20 shadow-inner">
                <p className="text-[9px] text-brand-primary/60 font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('offerModal.status')}</p>
                <p className="text-sm font-black text-white ml-1">{t('offerModal.active')}</p>
              </div>
            )}
            
            <div className={`p-5 rounded-[32px] border backdrop-blur-md shadow-inner ${isExpiringSoon ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 ml-1">{t('coupons.validUntil')}</p>
              <p className={`text-sm font-black ml-1 ${isExpiringSoon ? 'text-orange-400' : 'text-white'}`}>
                {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                {remaining && <span className="block text-[10px] font-black uppercase mt-1 opacity-60 tracking-wider">⚡ {remaining}</span>}
              </p>
            </div>
          </div>
          
          <p className="text-white/70 text-base leading-relaxed mb-10 px-1">{description || title}</p>
          
          {/* QR Code Section */}
          {qrCode && showQrCode && (
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[40px] text-center border border-white/10 shadow-3xl mb-10 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary opacity-30"></div>
              
              <div className="relative inline-block group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-[40px] opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative p-6 bg-white rounded-[36px] shadow-2xl">
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
                <code className="bg-[#0f172a] text-white/90 px-8 py-3.5 rounded-[20px] text-lg tracking-[0.3em] font-black border border-white/10 shadow-inner ring-1 ring-white/5">
                  {qrCode}
                </code>
                <div className="mt-6 flex items-center gap-2 bg-green-500/5 border border-green-500/20 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-green-400 animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                  className={`w-full font-black py-4 rounded-[24px] transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm uppercase tracking-[0.1em] ${
                    btn.primary 
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/20 border border-white/10 hover:opacity-90'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
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
              className="w-full flex items-center justify-between font-black text-white text-sm uppercase tracking-[0.2em] group outline-none"
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-brand-primary" />
                {t('offerModal.applicableBranches')}
                <span className="bg-brand-primary/20 text-brand-primary text-[10px] px-2 py-0.5 rounded-full">
                  {branches.length}
                </span>
              </div>
              <ChevronDown size={20} className={`text-white/40 group-hover:text-white transition-transform ${isBranchesOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid gap-3 overflow-hidden transition-all duration-300 ${isBranchesOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none m-0'}`}>
              {branches.length > 0 ? branches.map(branch => (
                <div key={branch.id || branch.branch_id} className="bg-white/5 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
                  <div>
                    <p className="font-bold text-white text-base">{branch.name || branch.branch_name}</p>
                    {branch.distance && (
                       <p className="text-[10px] text-brand-primary font-bold uppercase mt-1">{t('offerModal.distanceAway', { val: Math.round(branch.distance / 100) / 10 })}</p>
                    )}
                    <p className="text-xs text-white/40 font-medium mt-1">{t('offerModal.viewOnMap')}</p>
                  </div>
                  <button 
                    onClick={() => openInMaps(branch)}
                    className="bg-white text-brand-secondary p-3.5 rounded-2xl hover:opacity-90 active:scale-90 transition-all shadow-xl"
                  >
                    <Navigation size={20} fill="currentColor" />
                  </button>
                </div>
              )) : (
                <p className="text-xs text-white/40 italic px-1">{t('offerModal.loadingBranches')}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Close Button / Bottom Padding */}
        <div className="p-8 bg-white/5 border-t border-white/10">
          <button 
            onClick={onClose}
            className="w-full bg-white/10 text-white font-black py-4 rounded-[28px] hover:bg-white/20 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
          >
            {t('offerModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
