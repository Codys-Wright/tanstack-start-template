import { Card, cn, Skeleton, Spinner } from '@shadcn';
import React from 'react';
import { ArtistTypeGraphCard } from '../components/artist-type/artist-type-graph-card.js';
import type { ArtistData } from '../components/artist-type/artist-data-utils.js';

// ============================================================================
// PRE-SEEDED GRAPH DATA FOR LOADING ANIMATION
// ============================================================================

const ARTIST_TYPES = [
  {
    artistType: 'Visionary',
    fullName: 'The Visionary Artist',
    databaseId: 'the-visionary-artist',
  },
  {
    artistType: 'Consummate',
    fullName: 'The Consummate Artist',
    databaseId: 'the-consummate-artist',
  },
  {
    artistType: 'Analyzer',
    fullName: 'The Analyzer Artist',
    databaseId: 'the-analyzer-artist',
  },
  {
    artistType: 'Tech',
    fullName: 'The Tech Artist',
    databaseId: 'the-tech-artist',
  },
  {
    artistType: 'Entertainer',
    fullName: 'The Entertainer Artist',
    databaseId: 'the-entertainer-artist',
  },
  {
    artistType: 'Maverick',
    fullName: 'The Maverick Artist',
    databaseId: 'the-maverick-artist',
  },
  {
    artistType: 'Dreamer',
    fullName: 'The Dreamer Artist',
    databaseId: 'the-dreamer-artist',
  },
  {
    artistType: 'Feeler',
    fullName: 'The Feeler Artist',
    databaseId: 'the-feeler-artist',
  },
  {
    artistType: 'Tortured',
    fullName: 'The Tortured Artist',
    databaseId: 'the-tortured-artist',
  },
  {
    artistType: 'Solo',
    fullName: 'The Solo Artist',
    databaseId: 'the-solo-artist',
  },
];

// Generate random graph data
function generateRandomData(): ArtistData[] {
  const values = ARTIST_TYPES.map(() => Math.random() * 80 + 20); // 20-100 range
  const total = values.reduce((a, b) => a + b, 0);

  return ARTIST_TYPES.map((type, i) => ({
    ...type,
    points: Math.round(values[i] ?? 0),
    percentage: ((values[i] ?? 0) / total) * 100,
  }));
}

// Pre-generate a bunch of random data sets for smooth animation
const PREGENERATED_DATA: ArtistData[][] = Array.from({ length: 50 }, () => generateRandomData());

// ============================================================================
// MY RESPONSE PAGE LOADING ANIMATION
// ============================================================================

// Fixed height for mobile top card to match results page
// Needs to fit: icon (64px) + title + trait subtitle + percentage badge
const MOBILE_TOP_CARD_HEIGHT = 'h-[120px]';

/**
 * Loading animation component for the My Response page.
 * Shows a rapidly cycling radar chart with random data combinations.
 * Layout matches the results page exactly for seamless transition.
 * Mobile: Loading text on top, chart below, description skeleton, rankings skeleton
 * Desktop: Chart on left, loading text on right
 */
export function MyResponsePageLoading({ className }: { className?: string }) {
  const [dataIndex, setDataIndex] = React.useState(0);

  // Cycle through pre-generated data at 20fps (50ms interval)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDataIndex((prev) => (prev + 1) % PREGENERATED_DATA.length);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const currentData = PREGENERATED_DATA[dataIndex];

  return (
    <div className={cn('relative w-full px-4 pt-4 pb-8', className)}>
      <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Mobile: Loading text on TOP - fixed height to match results (hidden on desktop) */}
        <div className="lg:hidden">
          <Card className={cn('p-4', MOBILE_TOP_CARD_HEIGHT)}>
            <div className="flex items-start gap-4 h-full">
              {/* Placeholder for icon */}
              <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Calculating
                </p>
                <h2 className="text-xl font-bold">Getting your results...</h2>
                <p className="text-xs text-muted-foreground">Please wait</p>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main content grid - matches results page layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Mobile: Chart comes AFTER loading text */}
          {/* Desktop: Chart on left side (2/5) */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="lg:sticky lg:top-28">
              <div className="relative w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                <ArtistTypeGraphCard
                  data={currentData}
                  showBarChart={false}
                  className="bg-transparent border-none shadow-none"
                  contentClassName="p-0"
                  transparent
                  fill
                />
              </div>
            </div>
          </div>

          {/* Right side content */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-2">
            {/* Desktop: Loading placeholder (hidden on mobile) */}
            <div className="hidden lg:flex flex-col items-center justify-center space-y-6 py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <Spinner className="h-8 w-8 text-primary" />
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold">Getting your results...</h2>
                  <p className="text-muted-foreground">Calculating your artist type profile</p>
                </div>
              </div>
            </div>

            {/* Mobile: Description skeleton (hidden on desktop) */}
            <div className="lg:hidden">
              <Card className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-18 rounded-full" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Mobile: Rankings skeleton (hidden on desktop) */}
            <div className="lg:hidden">
              <Card className="p-4">
                <RankingsSkeleton />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MOBILE_TOP_CARD_HEIGHT };

// ============================================================================
// MY RESPONSE PAGE SKELETON (kept for SSR/fallback)
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
