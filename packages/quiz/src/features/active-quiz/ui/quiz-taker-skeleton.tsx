import { Card, cn, Skeleton } from '@shadcn';

// =============================================================================
// QUIZ TAKER PAGE SKELETON
// =============================================================================

/**
 * Skeleton component for the quiz taker page.
 * Matches the exact layout of QuizTakerPage for seamless SSR hydration.
 * Uses the user view layout (centered, single column) by default.
 */
export function QuizTakerPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full max-h-screen md:max-h-none h-[100dvh] md:h-auto px-4 pt-24 pb-16 md:pt-24 md:pb-8 flex flex-col overflow-hidden md:overflow-visible',
        className,
      )}
    >
      {/* User view: centered layout with max-width constraint */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-2 md:gap-8 flex-1 w-full max-w-3xl mx-auto">
          {/* Progress Bar Card Skeleton */}
          <ProgressBarCardSkeleton />

          {/* Question Card Skeleton */}
          <div className="flex items-center justify-center flex-1 md:min-h-[70vh]">
            <QuestionCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PROGRESS BAR CARD SKELETON
// =============================================================================

function ProgressBarCardSkeleton() {
  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Question number and progress bar */}
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          {/* "X of Y" text */}
          <Skeleton className="h-4 w-14 md:w-16" />
          {/* Progress bar - multi-segment */}
          <div className="flex-1">
            <Skeleton className="h-3 w-full rounded-sm" />
          </div>
        </div>
        {/* Settings button */}
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </Card>
  );
}

// =============================================================================
// QUESTION CARD SKELETON
// =============================================================================

function QuestionCardSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl h-full md:min-h-0">
      {/* Question Title Skeleton - Outside card */}
      <div className="flex-1 flex items-center justify-center py-2 md:py-12 min-h-0">
        <div className="flex flex-col items-center gap-2 w-full px-4">
          <Skeleton className="h-9 md:h-12 w-3/4" />
          <Skeleton className="h-9 md:h-12 w-1/2" />
        </div>
      </div>

      {/* Card and Navigation */}
      <div className="flex flex-col gap-2 md:gap-6">
        <Card className="gap-0 w-full shadow-2xl border border-border/60 bg-card ring-1 ring-ring/10">
          <Card.Content className="flex flex-col gap-2 md:gap-5 p-3 md:p-8">
            {/* Min Label Skeleton */}
            <Skeleton className="h-3 w-16" />

            {/* Rating buttons - Mobile: 2 rows, Desktop: single row */}
            <div className="flex flex-col gap-2">
              {/* Mobile Layout */}
              <div className="flex flex-col gap-2 md:hidden">
                {/* First row: 6 buttons */}
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
                {/* Second row: 5 buttons centered */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-[calc((100%-2rem)/6)] rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid w-full grid-cols-11 gap-2">
                {Array.from({ length: 11 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Max Label Skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-3 w-20" />
            </div>
          </Card.Content>
        </Card>

        {/* Navigation Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-3 pt-4 md:pt-4 md:pb-8">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ANALYSIS CHART SKELETON (kept for potential admin view use)
// =============================================================================

export function AnalysisChartSkeleton() {
  return (
    <div className="relative w-full h-full min-w-96 rounded-[32px] border border-neutral-200/50 bg-neutral-100 pt-4 px-2 pb-2 backdrop-blur-lg md:pt-6 md:px-4 md:pb-4 dark:border-neutral-700 dark:bg-neutral-800/50 overflow-visible">
      {/* Radar chart area */}
      <div className="w-full" style={{ aspectRatio: '1 / 1.1' }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
      {/* Bar chart area */}
      <div className="mt-2">
        <Skeleton className="w-full rounded-lg" style={{ height: '192px' }} />
      </div>
    </div>
  );
}

// =============================================================================
// LOADING STATE SKELETON (for initial/waiting states)
// =============================================================================

export function QuizLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </div>
  );
}
