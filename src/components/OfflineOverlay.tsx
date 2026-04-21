import { WifiOff, Wifi, X } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * @component OfflineBanner
 * @description A non-blocking slim banner that appears at the top of the screen
 * when the user loses internet connectivity, and a toast when it's restored.
 *
 * Design principles:
 * - NEVER blocks the UI — the user can still access their cached coupons.
 * - Clear visual distinction between "offline" (red) and "restored" (green).
 * - Dismissible so power users can hide it if they already know.
 */
export default function OfflineBanner() {
  const { isOnline, justCameBackOnline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state whenever we go offline again
  // so the banner always re-appears on the next disconnect
  if (!isOnline && dismissed) {
    // Only reset on actual state change — handled by key change in parent if needed.
  }

  // ── Connection Restored Toast ─────────────────────────────────────────────
  if (justCameBackOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-500">
        <div className="flex items-center gap-3 bg-status-success text-white px-5 py-3 rounded-2xl shadow-xl shadow-status-success/30 font-bold text-sm">
          <Wifi size={18} />
          <span>Conexión restaurada ✓</span>
        </div>
      </div>
    );
  }

  // ── Offline Banner ────────────────────────────────────────────────────────
  if (!isOnline && !dismissed) {
    return (
      <div className="sticky top-0 z-[150] w-full animate-in slide-in-from-top-2 fade-in duration-300">
        <div className="bg-neutral-900 text-white shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-7 h-7 bg-status-error/20 rounded-full flex items-center justify-center">
              <WifiOff size={14} className="text-status-error" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                Sin conexión a internet
              </p>
              <p className="text-[11px] text-white/60 font-medium mt-0.5">
                Tus cupones guardados siguen disponibles
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              aria-label="Cerrar aviso"
            >
              <X size={14} />
            </button>
          </div>

          {/* Capability chips */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-status-success/15 border border-status-success/20 text-status-success px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
              <span>✓</span> Ver cupones
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-status-success/15 border border-status-success/20 text-status-success px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
              <span>✓</span> Mostrar QR
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
              <span>✗</span> Reclamar
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
              <span>✗</span> Escanear
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * @component OfflineActionBadge
 * @description Inline badge to display next to buttons/actions that require internet.
 * Shows only when the user is offline so it never appears in normal usage.
 */
export function OfflineActionBadge() {
  const { isOnline } = useOnlineStatus();
  if (isOnline) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-status-error bg-status-error-bg px-2 py-0.5 rounded-full border border-status-error/20">
      <WifiOff size={9} />
      Sin red
    </span>
  );
}
