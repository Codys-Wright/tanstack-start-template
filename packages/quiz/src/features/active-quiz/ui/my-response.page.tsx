'use client';

import { Result, useAtomValue, useAtomSet, useAtomRefresh } from '@effect-atom/atom-react';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import { Badge, Button, Card, cn, Spinner } from '@shadcn';
import { CheckIcon, LinkIcon } from 'lucide-react';
import React from 'react';
import { Link } from '@tanstack/react-router';
import { BackgroundRippleEffect } from '@components';
import { ArtistTypeGraphCard } from '../components/artist-type/artist-type-graph-card.js';
import type { ArtistData } from '../components/artist-type/artist-data-utils.js';
import { getArtistTypeInfo } from '../components/artist-type/artist-type-descriptions.js';
import { generateShareableUrl, copyToClipboard } from './share-utils.js';
import { MyResponsePageSkeleton } from './my-response-skeleton.js';
import type { MyResponseLoaderData } from './load-my-response.js';
import { responsesAtom } from '../../responses/client/atoms.js';
import { analysesAtom, analyzeResponseWithServiceAtom } from '../../analysis/client/atoms.js';
import { enginesAtom } from '../../analysis-engine/client/atoms.js';
import { ResponseId } from '../../responses/domain/schema.js';
import { AnalyzeResponseRequest } from '../../analysis/domain/schema.js';

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
}

const WinnerHeroSection: React.FC<WinnerHeroProps> = ({ winnerId, percentage, artistData }) => {
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
    <div className="space-y-6">
      {/* Header with icon, title, and share button */}
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <img
            src={artistInfo.iconPath}
            alt={artistInfo.title}
            className="w-20 h-20 md:w-28 md:h-28 dark:brightness-0 dark:invert"
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                You are
              </div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{artistInfo.title}</h1>
            </div>
            {/* Share button */}
            <Button variant="outline" size="sm" onClick={handleShare} className="shrink-0">
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
          <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold">
            {percentage.toFixed(1)}% Match
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
        {artistInfo.description}
      </p>

      {/* Traits */}
      <div className="flex flex-wrap gap-2">
        {artistInfo.traits.map((trait) => (
          <Badge key={trait} variant="outline" className="text-xs">
            {trait}
          </Badge>
        ))}
      </div>
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
    <div className="relative w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
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
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/artist-types">
        <Button variant="outline" size="lg">
          Explore All Artist Types
        </Button>
      </Link>
      <Link to="/quiz">
        <Button size="lg">Retake the Quiz</Button>
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
  // Find the winner's percentage
  const winner = artistData.find((d) => d.databaseId === winnerId);
  const winnerPercentage = winner?.percentage ?? artistData[0]?.percentage ?? 0;
  const effectiveWinnerId = winnerId || artistData[0]?.databaseId || '';

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main content grid - Chart on left, Details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left side - Radar Chart (2/5 on large screens) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28">
              <ChartSection artistData={artistData} />
            </div>
          </div>

          {/* Right side - Winner info and rankings (3/5 on large screens) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Winner Hero with integrated share button */}
            <Card className="p-6">
              <WinnerHeroSection
                winnerId={effectiveWinnerId}
                percentage={winnerPercentage}
                artistData={artistData}
              />
            </Card>

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

const MyResponseInner: React.FC<MyResponseInnerProps> = ({ responseId }) => {
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
    console.log('[MyResponseInner] State:', {
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
        `[MyResponseInner] Polling for analysis (attempt ${retryCount + 1}/${maxRetries})`,
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
      console.log('[MyResponseInner] No active engine found');
      setAnalysisError('No active analysis engine found');
      return;
    }

    // Trigger analysis as fallback
    hasAttemptedAnalysis.current = true;
    setIsAnalyzing(true);
    console.log('[MyResponseInner] Triggering analysis for response:', responseId);

    // Create proper schema instance for the request
    const request = new AnalyzeResponseRequest({
      responseId: responseId as ResponseId,
      engineId: activeEngine.id,
    });

    analyzeResponse({ input: request })
      .then((result) => {
        console.log('[MyResponseInner] Analysis complete:', result);
        setIsAnalyzing(false);
        // Refresh to get the new analysis in the atom
        refreshAnalyses();
      })
      .catch((error) => {
        console.error('[MyResponseInner] Analysis failed:', error);
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

  // Show skeleton while loading
  if (!Result.isSuccess(responsesResult) || !Result.isSuccess(analysesResult)) {
    return <MyResponsePageSkeleton />;
  }

  // Show loading state while analyzing
  if (!analysis && isAnalyzing) {
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

  if (!analysis) {
    return (
      <PageContainer>
        <Card className="text-center py-12">
          <Card.Content className="space-y-4">
            <h2 className="text-xl font-semibold">Analysis Not Found</h2>
            <p className="text-muted-foreground">
              {analysisError ||
                'No analysis results found for this response. The analysis may still be processing.'}
            </p>
            <Link to="/quiz">
              <Button>Take the Quiz</Button>
            </Link>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  // Convert endingResults to ArtistData format
  const artistData: ArtistData[] = analysis.endingResults.map((result) => {
    const info = getArtistTypeInfo(result.endingId);
    return {
      databaseId: result.endingId,
      artistType: info?.shortName ?? result.endingId,
      fullName: info?.title ?? `The ${result.endingId} Artist`,
      points: result.points,
      percentage: result.percentage,
    };
  });

  // Find winner
  const winner = analysis.endingResults.find((r) => r.isWinner);
  const winnerId = winner?.endingId ?? artistData[0]?.databaseId ?? '';

  return <MyResponseContent artistData={artistData} winnerId={winnerId} />;
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
  return <MyResponsePageSkeleton />;
};

export default MyResponsePage;
