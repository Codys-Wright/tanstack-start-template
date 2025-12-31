import { cn, Skeleton } from '@shadcn';

// =============================================================================
// ARTIST TYPE GRAPH CARD SKELETON
// =============================================================================

/**
 * Simple skeleton that matches the overall dimensions of the ArtistTypeGraphCard.
 * Uses a single skeleton block to avoid layout mismatches during hydration.
 */
export function ArtistTypeGraphCardSkeleton({
  className,
  showBarChart = true,
}: {
  className?: string;
  showBarChart?: boolean;
}) {
  return (
    <div className={cn('flex flex-col overflow-hidden bg-transparent', className)}>
      {/* Radar chart area - matches aspect ratio 1/1.1 */}
      <div className="w-full p-0" style={{ aspectRatio: '1 / 1.1' }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>

      {/* Bar chart area - height matches 10 items * 28px = 280px */}
      {showBarChart && (
        <div className="p-2">
          <Skeleton className="w-full rounded-lg" style={{ height: '280px' }} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HERO SECTION SKELETON (for route-level loading if needed)
// =============================================================================

export function HeroSectionSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 min-w-screen">
      {/* Background grids (static) */}
      <BackgroundGridsSkeleton />

      {/* Main content */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 md:px-8 lg:grid-cols-3">
        {/* Left side - Text content */}
        <div className="lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="mb-4 mt-4 max-w-4xl">
            <Skeleton className="h-9 w-56 md:h-[72px] md:w-[420px]" />
            <Skeleton className="mt-2 h-9 w-44 md:h-[72px] md:w-[320px]" />
          </div>
          <Skeleton className="mt-4 h-5 w-72 max-w-xl md:h-6 md:w-96" />
          <div className="mb-10 mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row md:mb-20 lg:justify-start">
            <Skeleton className="h-10 w-full sm:w-52 rounded-lg" />
            <Skeleton className="h-10 w-full sm:w-52 rounded-lg" />
          </div>
        </div>

        {/* Right side - Chart card */}
        <div className="lg:col-span-1 w-full h-full">
          <div className="relative w-full h-full min-w-96 rounded-[32px] border border-neutral-200/50 bg-neutral-100 p-2 backdrop-blur-lg md:p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <ArtistTypeGraphCardSkeleton showBarChart className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BACKGROUND GRIDS SKELETON
// =============================================================================

function BackgroundGridsSkeleton() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 md:grid-cols-4">
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full bg-gradient-to-b from-transparent via-neutral-100 to-transparent dark:via-neutral-800">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
}

function GridLineVertical({ className }: { className?: string }) {
  return (
    <div
      style={
        {
          '--background': '#ffffff',
          '--color': 'rgba(0, 0, 0, 0.2)',
          '--height': '5px',
          '--width': '1px',
          '--fade-stop': '90%',
          '--offset': '150px',
          '--color-dark': 'rgba(255, 255, 255, 0.3)',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
      className={cn(
        'absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]',
        'bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]',
        '[background-size:var(--width)_var(--height)]',
        '[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]',
        '[mask-composite:exclude]',
        'z-30',
        'dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]',
        className,
      )}
    />
  );
}
