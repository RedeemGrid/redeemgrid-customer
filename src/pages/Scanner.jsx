import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, ChevronLeft, Zap, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Scanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the headless scanner to avoid English UI injection
    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      (result) => {
        setScanResult(result);
        alert(`${t('scanner.codeDetected')} ${result}`);
        
        // Stop scanning after success
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      },
      (error) => {
        // Silently ignore noise
      }
    ).catch(err => {
      console.error("Error starting camera", err);
    });

    scannerRef.current = html5QrCode;

    return () => {
      // Cleanup the scanner on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error clearing scanner", err));
      }
    };
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* Header Overlay */}
      <div className="w-full flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">{t('scanner.title')}</h2>
        <div className="w-12"></div>
      </div>

      {/* Scanner Container */}
      <div className="w-full max-w-sm aspect-square bg-black/40 backdrop-blur-xl border-2 border-dashed border-white/20 rounded-[48px] overflow-hidden relative shadow-2xl">
        <div id="reader" className="w-full h-full"></div>
        
        {/* Viewfinder Overlay Mask (CSS) */}
        {!scanResult && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-brand-primary/50 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-primary rounded-tl-xl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-primary rounded-tr-xl"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-primary rounded-bl-xl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-primary rounded-br-xl"></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Tip */}
      <div className="mt-8 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-4 max-w-sm w-full transition-all hover:bg-white/10">
        <div className="w-10 h-10 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
          <Zap size={20} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{t('scanner.scanToRedeem')}</p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-tight">
            {t('scanner.scanInstruction')}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center px-8">
        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">
          {t('scanner.poweredBy')}
        </p>
      </div>
    </div>
  );
}
