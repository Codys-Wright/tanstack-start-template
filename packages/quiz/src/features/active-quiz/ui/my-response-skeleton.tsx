import { Card, cn, Skeleton } from '@shadcn';

// ============================================================================
// MY RESPONSE PAGE SKELETON
// ============================================================================

/**
 * Skeleton component for the My Response page.
 * Matches the exact layout of MyResponsePage for seamless SSR hydration.
 */
export function MyResponsePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full px-4 pt-24 pb-8', className)}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section Skeleton */}
        <WinnerHeroSkeleton />

        {/* Full Analysis Section Skeleton */}
        <FullAnalysisSkeleton />

        {/* All Artist Types Section Skeleton */}
        <AllArtistTypesSkeleton />

        {/* Share Section Skeleton */}
        <ShareSkeleton />

        {/* Actions Skeleton */}
        <ActionsSkeleton />
      </div>
    </div>
  );
}

// ============================================================================
// WINNER HERO SKELETON
// ============================================================================

function WinnerHeroSkeleton() {
  return (
    <Card className="text-center py-8 md:py-12">
      <Card.Content className="space-y-6">
        {/* "You are" label */}
        <Skeleton className="h-4 w-16 mx-auto" />

        {/* Artist Type Icon */}
        <div className="flex justify-center">
          <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
        </div>

        {/* Artist Type Name */}
        <Skeleton className="h-12 w-72 mx-auto" />

        {/* Percentage Badge */}
        <Skeleton className="h-8 w-32 mx-auto rounded-full" />

        {/* Description */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6 mx-auto" />
          <Skeleton className="h-5 w-4/6 mx-auto" />
        </div>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// FULL ANALYSIS SKELETON
// ============================================================================

function FullAnalysisSkeleton() {
  return (
    <Card>
      <Card.Header>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-1" />
      </Card.Header>
      <Card.Content className="p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Radar chart skeleton */}
          <div className="w-full" style={{ aspectRatio: '1 / 1.1' }}>
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          {/* Bar chart skeleton */}
          <div className="mt-4">
            <Skeleton className="w-full rounded-lg" style={{ height: '288px' }} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// ALL ARTIST TYPES SKELETON
// ============================================================================

function AllArtistTypesSkeleton() {
  return (
    <Card>
      <Card.Header>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-56 mt-1" />
      </Card.Header>
      <Card.Content>
        <div className="grid gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg">
              {/* Rank */}
              <Skeleton className="h-6 w-6" />
              {/* Icon */}
              <Skeleton className="w-10 h-10 rounded-full" />
              {/* Name and traits */}
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Percentage */}
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// SHARE SKELETON
// ============================================================================

function ShareSkeleton() {
  return (
    <Card>
      <Card.Header>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-80 mt-1" />
      </Card.Header>
      <Card.Content>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </Card.Content>
    </Card>
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
