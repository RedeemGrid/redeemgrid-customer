import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ChevronLeft, Zap, Loader2, WifiOff, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import PermissionGuide from '@/components/PermissionGuide';
import { ScannerSkeleton } from '@/components/Skeleton';

export default function Scanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { isOnline } = useOnlineStatus();
  const cameraStatus = useCameraPermission();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Show skeleton briefly while camera warm up
    const timer = setTimeout(() => setIsInitializing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Use a ref to persist isProcessing inside the html5QrCode callback
  const processingRef = useRef(false);
  processingRef.current = isProcessing;

  const processScan = async (scannedData: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('user_redeem_offer', {
        p_user_id: user?.id,
        p_deal_id: scannedData
      });

      if (error) {
        throw new Error(error.message || t('scanner.errorProcessingScan'));
      }

      alert(t('scanner.offerRedeemedSuccess'));
      navigate('/coupons?filter=redeemed');
    } catch (err: any) {
      console.error(err);
      alert(err.message || t('scanner.errorProcessingScan'));
      // Reset scan so they can try again or go back
      setScanResult(null);
      navigate(-1);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOnline || !user || isInitializing) return;

    let isMounted = true;
    const startScanner = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMounted) return;

      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (result) => {
            if (processingRef.current) return;
            setScanResult(result);
            if (html5QrCode.isScanning) {
              html5QrCode.stop().catch(console.error);
            }
            processScan(result);
          },
          () => { /* ignore noise */ }
        );
      } catch (err: any) {
        console.error("Error starting camera", err);
        if (err?.name === 'NotAllowedError' || err?.toString().includes('NotAllowedError')) {
          setIsDenied(true);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => {
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
          })
          .catch(err => console.error("Error clearing scanner", err));
      }
    };
  }, [isOnline, user, isInitializing]); // Re-run if connection, user or init state changes

  // Update local isDenied state if the hook detects it
  useEffect(() => {
    if (cameraStatus === 'denied') {
      setIsDenied(true);
    }
  }, [cameraStatus]);

  if (isInitializing) {
    return <ScannerSkeleton />;
  }

  if (isDenied) {
    return (
      <div className="min-h-screen flex flex-col p-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl border border-black/5 shadow-sm transition-all focus:ring-2 focus:ring-brand-primary/10">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-main">{t('scanner.title')}</h2>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <PermissionGuide 
            type="camera" 
            onAlreadyFixed={() => {
              setIsDenied(false);
              window.location.reload();
            }} 
          />
        </div>
      </div>
    );
  }

  if (!user && isGuest) {
    return (
      <div className="min-h-screen flex flex-col p-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl border border-black/5 shadow-sm transition-all">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-main">{t('scanner.title')}</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-24 h-24 bg-brand-primary/5 rounded-[32px] flex items-center justify-center mb-8 border border-brand-primary/10">
            <QrCode size={48} className="text-brand-primary opacity-40" />
          </div>
          <h3 className="text-2xl font-black text-text-main mb-3 tracking-tight">{t('scanner.title')}</h3>
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
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* Header Overlay */}
      <div className="w-full flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white text-text-muted hover:text-text-main rounded-2xl border border-black/5 shadow-sm transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-main">{t('scanner.title')}</h2>
        <div className="w-12"></div>
      </div>

      {/* Scanner Container */}
      <div className="w-full max-w-sm aspect-square bg-neutral-900 border-2 border-dashed border-black/5 rounded-[48px] overflow-hidden relative shadow-premium flex items-center justify-center">
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in">
            <Loader2 size={48} className="text-brand-primary animate-spin" />
            <p className="text-white font-black uppercase tracking-widest text-sm text-center whitespace-pre-wrap">{t('scanner.processingCoupon')}</p>
          </div>
        )}
        
        {!isOnline ? (
          <div className="absolute inset-0 z-20 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-status-error/10 rounded-2xl flex items-center justify-center text-status-error mb-4">
              <WifiOff size={32} />
            </div>
            <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tight">{t('scanner.offlineScannerTitle')}</h3>
            <p className="text-white/50 text-xs font-bold leading-relaxed px-4">
              {t('scanner.offlineScannerDesc')}
            </p>
          </div>
        ) : (
          <div id="reader" className="w-full h-full absolute inset-0 z-0"></div>
        )}
        
        {/* Viewfinder Overlay Mask (CSS) */}
        {!scanResult && !isProcessing && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-brand-primary/50 relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-primary"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-primary"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-primary"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-primary"></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Tip */}
      <div className="mt-8 bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-black/5 shadow-premium flex items-center gap-4 max-w-sm w-full transition-all hover:bg-white">
        <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
          <Zap size={20} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-main">{t('scanner.scanToRedeem')}</p>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-tight">
            {t('scanner.scanInstruction')}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center px-8">
        <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em]">
          {t('scanner.poweredBy')}
        </p>
      </div>
    </div>
  );
}

