import { Card, cn, Skeleton } from '@shadcn';

// ============================================================================
// MY RESPONSE PAGE SKELETON
// ============================================================================

/**
 * Skeleton component for the My Response page.
 * Matches the new grid layout of MyResponsePage for seamless SSR hydration.
 */
export function MyResponsePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full px-4 pt-4 pb-8', className)}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main content grid - Chart on left, Details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left side - Radar Chart (2/5 on large screens) */}
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>

          {/* Right side - Winner info and rankings (3/5 on large screens) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Winner Hero */}
            <Card className="p-6">
              <WinnerHeroSkeleton />
            </Card>

            {/* Rankings */}
            <Card className="p-4">
              <RankingsSkeleton />
            </Card>

            {/* Actions Skeleton */}
            <ActionsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHART SKELETON (Radar chart)
// ============================================================================

function ChartSkeleton() {
  return (
    <div className="relative w-full rounded-2xl border border-border/50 bg-card/50 p-4">
      <div className="w-full" style={{ aspectRatio: '1 / 1' }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// WINNER HERO SKELETON (Compact horizontal layout)
// ============================================================================

function WinnerHeroSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with icon, title, and share button */}
      <div className="flex items-start gap-6">
        <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 md:h-10 w-48 md:w-64" />
            </div>
            {/* Share button skeleton */}
            <Skeleton className="h-8 w-20 rounded-md shrink-0" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Traits */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================================
// RANKINGS SKELETON
// ============================================================================

function RankingsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded-lg">
            {/* Rank */}
            <Skeleton className="h-4 w-5" />
            {/* Icon */}
            <Skeleton className="w-7 h-7 rounded-full" />
            {/* Name */}
            <Skeleton className="h-4 w-24 flex-1" />
            {/* Progress bar and percentage */}
            <div className="w-24 flex items-center gap-2">
              <Skeleton className="flex-1 h-1.5 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ACTIONS SKELETON
// ============================================================================

function ActionsSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Skeleton className="h-11 w-48 rounded-md" />
      <Skeleton className="h-11 w-36 rounded-md" />
    </div>
  );
}
