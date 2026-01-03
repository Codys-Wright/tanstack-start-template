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
    <div className={cn('relative w-full px-4 pb-8', className)}>
      {/* User view: centered layout with max-width constraint */}
      <div className="w-full max-w-7xl mx-auto flex justify-center">
        <div className="flex flex-col gap-8 w-full max-w-3xl">
          {/* Progress Bar Card Skeleton */}
          <ProgressBarCardSkeleton />

          {/* Question Card Skeleton */}
          <div className="flex items-center justify-center min-h-[70vh]">
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
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Question number and progress bar */}
        <div className="flex items-center gap-4 flex-1">
          {/* "X of Y" text */}
          <Skeleton className="h-4 w-16" />
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
    <Card className="gap-0 w-full max-w-3xl shadow-2xl border border-border/60 bg-card ring-1 ring-ring/10">
      {/* Header with question title */}
      <Card.Header className="p-4 min-h-36 flex items-center justify-center text-center">
        <div className="flex flex-col items-center gap-2 w-full">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6">
        {/* Rating buttons grid (11 buttons for 0-10) */}
        <div className="flex flex-1 items-center">
          <div className="grid w-full grid-cols-11 gap-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </div>

        {/* Navigation row: Back button, labels, Next/Submit button */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center">
          {/* Back button */}
          <Skeleton className="h-9 w-16 rounded-md" />

          {/* Min/Max labels */}
          <div className="flex items-center justify-center gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-1" />
            <Skeleton className="h-3 w-12" />
          </div>

          {/* Next button */}
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </Card.Content>
    </Card>
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
