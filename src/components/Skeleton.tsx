/**
 * @component Skeleton
 * @description Base shimmer/pulse component for skeleton loading screens.
 * Use this instead of spinners to keep the UI feeling alive and premium
 * while content is being fetched.
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * @component DealCardSkeleton
 * @description Skeleton that mimics the shape of a deal card in the Explore tab.
 */
export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] shadow-premium overflow-hidden flex flex-col" aria-hidden="true">
      {/* Image placeholder */}
      <Skeleton className="h-44 w-full rounded-none rounded-t-[32px]" />
      <div className="p-6 space-y-4">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
        </div>
        {/* Title */}
        <Skeleton className="h-6 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        {/* Footer */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * @component CouponCardSkeleton
 * @description Skeleton that mimics the shape of a coupon card in My Coupons tab.
 */
export function CouponCardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] shadow-premium overflow-hidden flex flex-col" aria-hidden="true">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-none rounded-t-[32px]" />
      <div className="p-6 space-y-3">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
        {/* Title */}
        <Skeleton className="h-6 w-full rounded-lg" />
        <Skeleton className="h-6 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * @component ProfileSkeleton
 * @description Skeleton for the Profile page.
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-8 pb-24" aria-hidden="true">
      <section className="text-center pt-8">
        <Skeleton className="w-32 h-32 rounded-[44px] mx-auto mb-10" />
        <Skeleton className="h-8 w-48 mx-auto rounded-lg mb-4" />
        <div className="flex justify-center gap-3">
          <Skeleton className="h-6 w-24 rounded-xl" />
          <Skeleton className="h-6 w-32 rounded-xl" />
        </div>
      </section>
      
      <section className="space-y-4">
        <Skeleton className="h-3 w-32 ml-2 rounded-md" />
        <div className="bg-white rounded-[40px] shadow-premium border border-black/5 divide-y divide-black/5">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * @component ScannerSkeleton
 * @description Skeleton for the Scanner page.
 */
export function ScannerSkeleton() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4" aria-hidden="true">
      <div className="w-full flex items-center justify-between mb-8">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-32 h-8 rounded-lg" />
        <div className="w-12" />
      </div>
      <Skeleton className="w-full max-w-sm aspect-square rounded-[48px]" />
      <Skeleton className="mt-8 w-full max-w-sm h-24 rounded-3xl" />
    </div>
  );
}

/**
 * @component MainAppSkeleton
 * @description A top-level skeleton that mimics the app shell (header + empty body + nav).
 * Used during authentication checks or root level loading.
 */
export function MainAppSkeleton() {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col" aria-hidden="true">
      {/* Header Mock */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-black/5 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
        <Skeleton className="w-11 h-11 rounded-[16px]" />
      </header>

      {/* Content Space */}
      <main className="max-w-lg mx-auto w-full p-4 flex-1 space-y-6">
        <div className="flex justify-between items-center mt-4">
           <Skeleton className="h-10 w-40 rounded-xl" />
           <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <DealCardSkeleton />
        <DealCardSkeleton />
      </main>

      {/* Bottom Nav Mock */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-30">
        <div className="flex items-center gap-1 bg-white border border-black/5 px-2 py-2 rounded-2xl shadow-xl">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className={`h-12 ${i === 1 ? 'w-28' : 'w-14'} rounded-xl`} />
          ))}
        </div>
      </div>
    </div>
  );
}
