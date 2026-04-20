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
