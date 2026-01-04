'use client';

import { Result, useAtomValue, useAtomSet, useAtomRefresh } from '@effect-atom/atom-react';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import { Badge, Button, Card, cn, Spinner } from '@shadcn';
import { CheckIcon, LinkIcon } from 'lucide-react';
import React from 'react';
import { Link } from '@tanstack/react-router';
import confetti from 'canvas-confetti';
import { BackgroundRippleEffect } from '@components';
import { ArtistTypeGraphCard } from '../components/artist-type/artist-type-graph-card.js';
import type { ArtistData } from '../components/artist-type/artist-data-utils.js';
import { getArtistTypeInfo } from '../components/artist-type/artist-type-descriptions.js';
import { generateShareableUrl, copyToClipboard } from './share-utils.js';
import { MyResponsePageLoading, MOBILE_TOP_CARD_HEIGHT } from './my-response-skeleton.js';
import type { MyResponseLoaderData } from './load-my-response.js';
import { responsesAtom } from '../../responses/client/atoms.js';
import { analysesAtom, analyzeResponseWithServiceAtom } from '../../analysis/client/atoms.js';
import { enginesAtom } from '../../analysis-engine/client/atoms.js';
import { ResponseId } from '../../responses/domain/schema.js';
import { AnalyzeResponseRequest } from '../../analysis/domain/schema.js';

// ============================================================================
// Confetti Effect
// ============================================================================

/**
 * Fires a subtle side cannon confetti effect.
 * Shoots gently from both sides of the screen.
 */
function fireSideCannons() {
  const duration = 1.5 * 1000; // 1.5 seconds
  const end = Date.now() + duration;
  const colors = [
    '#a786ff', // purple
    '#fd8bbc', // pink
    '#eca184', // peach
    '#f8deb1', // cream
    '#87ceeb', // sky blue
    '#98fb98', // pale green
    '#ffd700', // gold
    '#ff6b6b', // coral red
    '#c9b1ff', // lavender
    '#88d8b0', // mint
  ];

  let frameCount = 0;

  const frame = () => {
    if (Date.now() > end) return;

    frameCount++;
    // Only fire every 3rd frame for less density
    if (frameCount % 3 !== 0) {
      requestAnimationFrame(frame);
      return;
    }

    // Pick random colors for each particle
    const leftColor = colors[Math.floor(Math.random() * colors.length)];
    const rightColor = colors[Math.floor(Math.random() * colors.length)];

    // Left cannon - subtle
    confetti({
      particleCount: 1,
      angle: 60,
      spread: 40,
      startVelocity: 30,
      gravity: 0.8,
      origin: { x: 0, y: 0.6 },
      colors: [leftColor!],
      ticks: 150,
      scalar: 0.8,
    });

    // Right cannon - subtle
    confetti({
      particleCount: 1,
      angle: 120,
      spread: 40,
      startVelocity: 30,
      gravity: 0.8,
      origin: { x: 1, y: 0.6 },
      colors: [rightColor!],
      ticks: 150,
      scalar: 0.8,
    });

    requestAnimationFrame(frame);
  };

  frame();
}

/**
 * Hook to fire confetti when the component mounts (results are shown).
 */
function useResultsConfetti() {
  React.useEffect(() => {
    console.log('[Confetti] useResultsConfetti effect running');

    // Small delay to ensure the content is visible
    const timer = setTimeout(() => {
      console.log('[Confetti] Timer fired, calling fireSideCannons');
      fireSideCannons();
    }, 200);

    return () => clearTimeout(timer);
  }, []);
}

// ============================================================================
// Types
// ============================================================================

export interface MyResponsePageProps {
  /**
   * Response ID to display results for.
   * If not provided, will try to decode from URL query param 'd' for shared results.
   */
  responseId?: string;

  /**
   * Pre-computed artist data (for shared results decoded from URL)
   */
  artistData?: ArtistData[];

  /**
   * Winner ID (for shared results)
   */
  winnerId?: string;

  /**
   * Loader data from TanStack Router containing dehydrated atoms.
   */
  loaderData?: MyResponseLoaderData;
}

// ============================================================================
// Page Container
// ============================================================================

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full px-4 pt-4 pb-8">
    {/* Background ripple effect */}
    <BackgroundRippleEffect
      cellSize={80}
      ambient
      ambientInterval={4000}
      portal
      vignettePosition="center"
      vignetteFadeCenter
      className="opacity-30"
    />
    {children}
  </div>
);

// ============================================================================
// Winner Hero Section (Compact version for grid layout)
// ============================================================================

interface WinnerHeroProps {
  winnerId: string;
  percentage: number;
  artistData: ArtistData[];
  /** Compact mode hides description and traits (used on mobile) */
  compact?: boolean;
}

const WinnerHeroSection: React.FC<WinnerHeroProps> = ({
  winnerId,
  percentage,
  artistData,
  compact = false,
}) => {
  const artistInfo = getArtistTypeInfo(winnerId);
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');

  React.useEffect(() => {
    setShareUrl(generateShareableUrl(artistData, winnerId));
  }, [artistData, winnerId]);

  const handleShare = async () => {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!artistInfo) {
    return (
      <Card className="text-center py-12">
        <Card.Content className="space-y-4">
          <p className="text-muted-foreground">Could not load artist type information</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {/* Header with icon, title, and share button */}
      <div className="flex items-start gap-4 md:gap-6">
        <div className="shrink-0">
          <img
            src={artistInfo.iconPath}
            alt={artistInfo.title}
            className={cn(
              'dark:brightness-0 dark:invert',
              compact ? 'w-16 h-16' : 'w-20 h-20 md:w-28 md:h-28',
            )}
          />
        </div>
        <div className="flex-1 space-y-1 md:space-y-2">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="space-y-0.5 md:space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                You are
              </div>
              <h1
                className={cn(
                  'font-bold tracking-tight',
                  compact ? 'text-xl' : 'text-2xl md:text-4xl',
                )}
              >
                {artistInfo.title}
              </h1>
              {/* First trait as subtitle in compact mode */}
              {compact && artistInfo.traits[0] && (
                <p className="text-xs text-muted-foreground">{artistInfo.traits[0]}</p>
              )}
            </div>
            {/* Share button */}
            <Button
              variant="outline"
              size={compact ? 'sm' : 'sm'}
              onClick={handleShare}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-1.5" />
                  Share
                </>
              )}
            </Button>
          </div>
          <Badge
            variant="secondary"
            className={cn('font-semibold', compact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1')}
          >
            {percentage.toFixed(1)}% Match
          </Badge>
        </div>
      </div>

      {/* Description - hidden in compact mode */}
      {!compact && (
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          {artistInfo.description}
        </p>
      )}

      {/* Traits - hidden in compact mode */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {artistInfo.traits.map((trait) => (
            <Badge key={trait} variant="outline" className="text-xs">
              {trait}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Chart Section (Radar chart only, more compact)
// ============================================================================

interface ChartSectionProps {
  artistData: ArtistData[];
}

const ChartSection: React.FC<ChartSectionProps> = ({ artistData }) => {
  return (
    <div className="relative w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2">
      <ArtistTypeGraphCard
        data={artistData}
        showBarChart={false}
        className="bg-transparent border-none shadow-none"
        contentClassName="p-0"
        transparent
        fill
      />
    </div>
  );
};

// ============================================================================
// Rankings Section (Compact list of all artist types)
// ============================================================================

interface RankingsSectionProps {
  artistData: ArtistData[];
}

const RankingsSection: React.FC<RankingsSectionProps> = ({ artistData }) => {
  // Sort by percentage descending, skip the first (winner is shown separately)
  const sortedData = [...artistData].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Your Rankings
      </h3>
      <div className="space-y-1">
        {sortedData.map((data, index) => {
          const info = getArtistTypeInfo(data.databaseId);
          const isWinner = index === 0;

          return (
            <div
              key={data.databaseId}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                isWinner ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50',
              )}
            >
              {/* Rank */}
              <div className="text-sm font-bold text-muted-foreground w-5 text-center">
                {index + 1}
              </div>

              {/* Icon */}
              <img
                src={info?.iconPath ?? `/svgs/artist-type-logos/${index + 1}_LOGO.svg`}
                alt={data.fullName}
                className="w-7 h-7 dark:brightness-0 dark:invert"
              />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {info?.shortName ?? data.artistType}
                </div>
              </div>

              {/* Percentage bar */}
              <div className="w-24 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {data.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Actions Section
// ============================================================================

const ActionsSection: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Link to="/quiz" className="w-full">
        <Button size="lg" className="w-full">
          Retake the Quiz
        </Button>
      </Link>
      <Link to="/artist-types" className="w-full">
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
          Explore All Artist Types
        </Button>
      </Link>
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

interface MyResponseContentProps {
  artistData: ArtistData[];
  winnerId: string;
}

const MyResponseContent: React.FC<MyResponseContentProps> = ({ artistData, winnerId }) => {
  // Fire confetti when results are shown
  useResultsConfetti();

  // Find the winner's percentage
  const winner = artistData.find((d) => d.databaseId === winnerId);
  const winnerPercentage = winner?.percentage ?? artistData[0]?.percentage ?? 0;
  const effectiveWinnerId = winnerId || artistData[0]?.databaseId || '';
  const artistInfo = getArtistTypeInfo(effectiveWinnerId);

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Mobile: Compact winner header on TOP - fixed height to match loading (hidden on desktop) */}
        <div className="lg:hidden">
          <Card className={cn('p-4', MOBILE_TOP_CARD_HEIGHT)}>
            <WinnerHeroSection
              winnerId={effectiveWinnerId}
              percentage={winnerPercentage}
              artistData={artistData}
              compact
            />
          </Card>
        </div>

        {/* Main content grid - Chart on left, Details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Mobile: Chart comes AFTER the winner header */}
          {/* Desktop: Chart on left side (2/5) */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="lg:sticky lg:top-28">
              <ChartSection artistData={artistData} />
            </div>
          </div>

          {/* Right side - Winner info and rankings (3/5 on large screens) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-2">
            {/* Full Winner Hero - hidden on mobile, shown on desktop */}
            <Card className="p-6 hidden lg:block">
              <WinnerHeroSection
                winnerId={effectiveWinnerId}
                percentage={winnerPercentage}
                artistData={artistData}
              />
            </Card>

            {/* Mobile: Description card (hidden on desktop) */}
            {artistInfo && (
              <Card className="p-4 lg:hidden">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {artistInfo.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {artistInfo.traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Rankings */}
            <Card className="p-4">
              <RankingsSection artistData={artistData} />
            </Card>

            {/* Action Buttons */}
            <ActionsSection />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

// ============================================================================
// Inner component that uses atoms (must be inside HydrationBoundary)
// ============================================================================

interface MyResponseInnerProps {
  responseId: string;
}

/**
 * Hook to manage the data fetching and analysis logic.
 * Returns the current state: loading, analyzing, error, or ready with data.
 */
function useResponseAnalysis(responseId: string) {
  const responsesResult = useAtomValue(responsesAtom);
  const analysesResult = useAtomValue(analysesAtom);
  const enginesResult = useAtomValue(enginesAtom);
  const analyzeResponse = useAtomSet(analyzeResponseWithServiceAtom, {
    mode: 'promise',
  });
  const refreshAnalyses = useAtomRefresh(analysesAtom);

  // Track analysis state
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const hasAttemptedAnalysis = React.useRef(false);
  const maxRetries = 10;
  const retryInterval = 2000; // 2 seconds

  // Find the analysis for this response
  const analysis = React.useMemo(() => {
    if (!Result.isSuccess(analysesResult)) return undefined;
    return analysesResult.value.find((a) => a.responseId === responseId);
  }, [analysesResult, responseId]);

  // Debug logging
  React.useEffect(() => {
    console.log('[useResponseAnalysis] State:', {
      responseId,
      responsesResult: Result.isSuccess(responsesResult)
        ? `${responsesResult.value.length} responses`
        : 'loading/error',
      analysesResult: Result.isSuccess(analysesResult)
        ? `${analysesResult.value.length} analyses`
        : 'loading/error',
      hasAnalysis: !!analysis,
      retryCount,
    });
  }, [responseId, responsesResult, analysesResult, analysis, retryCount]);

  // Poll for analysis if not found (server may be processing it)
  React.useEffect(() => {
    // Don't poll if we already have analysis or hit max retries
    if (analysis) return;
    if (retryCount >= maxRetries) {
      setAnalysisError('Analysis timed out. Please refresh the page.');
      return;
    }
    if (!Result.isSuccess(analysesResult)) return;

    // Start polling
    const timeoutId = setTimeout(() => {
      console.log(
        `[useResponseAnalysis] Polling for analysis (attempt ${retryCount + 1}/${maxRetries})`,
      );
      refreshAnalyses();
      setRetryCount((c) => c + 1);
    }, retryInterval);

    return () => clearTimeout(timeoutId);
  }, [analysis, analysesResult, retryCount, refreshAnalyses]);

  // Trigger analysis if no analysis exists after initial poll attempts
  React.useEffect(() => {
    if (hasAttemptedAnalysis.current) return;
    if (analysis) return; // Already have analysis
    if (retryCount < 3) return; // Wait for a few poll attempts first
    if (!Result.isSuccess(analysesResult)) return;
    if (!Result.isSuccess(enginesResult)) return;

    const activeEngine = enginesResult.value.find((e) => e.isActive);
    if (!activeEngine) {
      console.log('[useResponseAnalysis] No active engine found');
      setAnalysisError('No active analysis engine found');
      return;
    }

    // Trigger analysis as fallback
    hasAttemptedAnalysis.current = true;
    setIsAnalyzing(true);
    console.log('[useResponseAnalysis] Triggering analysis for response:', responseId);

    // Create proper schema instance for the request
    const request = new AnalyzeResponseRequest({
      responseId: responseId as ResponseId,
      engineId: activeEngine.id,
    });

    analyzeResponse({ input: request })
      .then((result) => {
        console.log('[useResponseAnalysis] Analysis complete:', result);
        setIsAnalyzing(false);
        // Refresh to get the new analysis in the atom
        refreshAnalyses();
      })
      .catch((error) => {
        console.error('[useResponseAnalysis] Analysis failed:', error);
        setAnalysisError('Failed to analyze response');
        setIsAnalyzing(false);
      });
  }, [
    responseId,
    analysis,
    analysesResult,
    enginesResult,
    retryCount,
    analyzeResponse,
    refreshAnalyses,
  ]);

  // Determine current state
  const isDataLoading = !Result.isSuccess(responsesResult) || !Result.isSuccess(analysesResult);

  // Convert analysis to artist data if available
  const artistData: ArtistData[] | undefined = analysis
    ? analysis.endingResults.map((result) => {
        const info = getArtistTypeInfo(result.endingId);
        return {
          databaseId: result.endingId,
          artistType: info?.shortName ?? result.endingId,
          fullName: info?.title ?? `The ${result.endingId} Artist`,
          points: result.points,
          percentage: result.percentage,
        };
      })
    : undefined;

  // Find winner
  const winner = analysis?.endingResults.find((r) => r.isWinner);
  const winnerId = winner?.endingId ?? artistData?.[0]?.databaseId ?? '';

  return {
    isDataLoading,
    isAnalyzing,
    analysisError,
    hasAnalysis: !!analysis,
    artistData,
    winnerId,
  };
}

/**
 * Coordinated loading component that shows loading animation while
 * hydration and data fetching happen concurrently in the background.
 */
const MyResponseWithLoading: React.FC<MyResponseInnerProps> = ({ responseId }) => {
  // Minimum loading time for smooth UX (prevents flash of content)
  const MIN_LOADING_MS = 2000;

  const [minLoadingComplete, setMinLoadingComplete] = React.useState(false);
  const [shouldShowContent, setShouldShowContent] = React.useState(false);

  // Get data state from atoms (this triggers hydration)
  const { isDataLoading, isAnalyzing, analysisError, hasAnalysis, artistData, winnerId } =
    useResponseAnalysis(responseId);

  // Start minimum loading timer on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[MyResponseWithLoading] Min loading time complete');
      setMinLoadingComplete(true);
    }, MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  // Determine when to show content
  const dataReady = !isDataLoading && hasAnalysis && artistData;

  // Transition to content when both conditions are met
  React.useEffect(() => {
    if (minLoadingComplete && dataReady) {
      console.log('[MyResponseWithLoading] Both conditions met, showing content');
      setShouldShowContent(true);
    }
  }, [minLoadingComplete, dataReady]);

  // Debug logging
  React.useEffect(() => {
    console.log('[MyResponseWithLoading] Render state:', {
      minLoadingComplete,
      isDataLoading,
      hasAnalysis,
      dataReady,
      shouldShowContent,
    });
  }, [minLoadingComplete, isDataLoading, hasAnalysis, dataReady, shouldShowContent]);

  // Show error state if analysis failed
  if (analysisError && minLoadingComplete) {
    return (
      <PageContainer>
        <Card className="text-center py-12">
          <Card.Content className="space-y-4">
            <h2 className="text-xl font-semibold">Analysis Error</h2>
            <p className="text-muted-foreground">{analysisError}</p>
            <Link to="/quiz">
              <Button>Take the Quiz Again</Button>
            </Link>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  // Show "analyzing" state if we're past min loading but still analyzing
  if (minLoadingComplete && !hasAnalysis && isAnalyzing) {
    return (
      <PageContainer>
        <Card className="text-center py-12">
          <Card.Content className="space-y-4">
            <Spinner className="mx-auto h-8 w-8" />
            <h2 className="text-xl font-semibold">Analyzing Your Results</h2>
            <p className="text-muted-foreground">
              Please wait while we analyze your quiz responses...
            </p>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  // Show "not found" state if we're past loading and polling but no analysis
  if (minLoadingComplete && !hasAnalysis && !isAnalyzing && !isDataLoading) {
    return (
      <PageContainer>
        <Card className="text-center py-12">
          <Card.Content className="space-y-4">
            <h2 className="text-xl font-semibold">Analysis Not Found</h2>
            <p className="text-muted-foreground">
              No analysis results found for this response. The analysis may still be processing.
            </p>
            <Link to="/quiz">
              <Button>Take the Quiz</Button>
            </Link>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  // Show loading animation until ready
  if (!shouldShowContent) {
    return <MyResponsePageLoading />;
  }

  // Show content
  return <MyResponseContent artistData={artistData!} winnerId={winnerId} />;
};

/**
 * Legacy inner component - kept for backwards compatibility.
 * Now just wraps MyResponseWithLoading.
 */
const MyResponseInner: React.FC<MyResponseInnerProps> = ({ responseId }) => {
  return <MyResponseWithLoading responseId={responseId} />;
};

// ============================================================================
// Page with Data Loading
// ============================================================================

/**
 * MyResponsePage - Displays quiz results for a given response.
 *
 * Supports two modes:
 * 1. With responseId: Fetches data from the server
 * 2. With artistData/winnerId: Displays pre-decoded shared results
 */
export const MyResponsePage: React.FC<MyResponsePageProps> = ({
  responseId,
  artistData: preloadedArtistData,
  winnerId: preloadedWinnerId,
  loaderData,
}) => {
  // If we have preloaded data (from shared URL), use it directly
  if (preloadedArtistData && preloadedWinnerId) {
    return <MyResponseContent artistData={preloadedArtistData} winnerId={preloadedWinnerId} />;
  }

  // If we have loaderData and responseId, use hydration boundary
  if (loaderData && responseId) {
    const hydrationState = [loaderData.response, loaderData.analyses];

    return (
      <HydrationBoundary state={hydrationState}>
        <MyResponseInner responseId={responseId} />
      </HydrationBoundary>
    );
  }

  // No data available
  return <MyResponsePageLoading />;
};

export default MyResponsePage;
