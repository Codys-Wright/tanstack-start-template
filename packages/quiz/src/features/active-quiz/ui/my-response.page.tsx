'use client';

import { Result, useAtomValue, useAtomSet, useAtomRefresh } from '@effect-atom/atom-react';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import { Badge, Button, Card, cn, Spinner } from '@shadcn';
import { CheckIcon, CopyIcon, LinkIcon } from 'lucide-react';
import React from 'react';
import { Link } from '@tanstack/react-router';
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
  <div className="relative w-full px-4 pt-24 pb-8">{children}</div>
);

// ============================================================================
// Winner Hero Section
// ============================================================================

interface WinnerHeroProps {
  winnerId: string;
  percentage: number;
}

const WinnerHeroSection: React.FC<WinnerHeroProps> = ({ winnerId, percentage }) => {
  const artistInfo = getArtistTypeInfo(winnerId);

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
    <Card className="text-center py-8 md:py-12 overflow-hidden">
      <Card.Content className="space-y-6">
        {/* "You are" label */}
        <div className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
          You are
        </div>

        {/* Artist Type Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={artistInfo.iconPath}
              alt={artistInfo.title}
              className="w-24 h-24 md:w-32 md:h-32 dark:brightness-0 dark:invert"
            />
          </div>
        </div>

        {/* Artist Type Name */}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{artistInfo.title}</h1>

        {/* Percentage Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-lg px-4 py-1.5 font-semibold">
            {percentage.toFixed(1)}% Match
          </Badge>
        </div>

        {/* Description */}
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          {artistInfo.description}
        </p>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {artistInfo.traits.map((trait) => (
            <Badge key={trait} variant="outline" className="text-sm">
              {trait}
            </Badge>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// Share Section
// ============================================================================

interface ShareSectionProps {
  artistData: ArtistData[];
  winnerId: string;
}

const ShareSection: React.FC<ShareSectionProps> = ({ artistData, winnerId }) => {
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');

  React.useEffect(() => {
    // Generate URL on client side
    setShareUrl(generateShareableUrl(artistData, winnerId));
  }, [artistData, winnerId]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Share Your Results
        </Card.Title>
        <Card.Description>
          Share your artist type with friends! The link contains your results encoded in the URL.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate"
          />
          <Button onClick={handleCopyLink} variant="secondary" className="shrink-0">
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// Full Analysis Section
// ============================================================================

interface FullAnalysisSectionProps {
  artistData: ArtistData[];
}

const FullAnalysisSection: React.FC<FullAnalysisSectionProps> = ({ artistData }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Your Full Analysis</Card.Title>
        <Card.Description>See how you scored across all 10 artist types</Card.Description>
      </Card.Header>
      <Card.Content className="p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <ArtistTypeGraphCard
            data={artistData}
            showBarChart
            barChartHeight="h-72"
            barChartMaxItems={10}
            className="bg-transparent border-none shadow-none"
            contentClassName="p-0"
            transparent
          />
        </div>
      </Card.Content>
    </Card>
  );
};

// ============================================================================
// All Artist Types Section
// ============================================================================

interface AllArtistTypesSectionProps {
  artistData: ArtistData[];
}

const AllArtistTypesSection: React.FC<AllArtistTypesSectionProps> = ({ artistData }) => {
  // Sort by percentage descending
  const sortedData = [...artistData].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card>
      <Card.Header>
        <Card.Title>All Artist Types</Card.Title>
        <Card.Description>Your compatibility with each artist type</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid gap-3">
          {sortedData.map((data, index) => {
            const info = getArtistTypeInfo(data.databaseId);
            const isWinner = index === 0;

            return (
              <div
                key={data.databaseId}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-colors',
                  isWinner ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50',
                )}
              >
                {/* Rank */}
                <div className="text-lg font-bold text-muted-foreground w-6">{index + 1}</div>

                {/* Icon */}
                <img
                  src={info?.iconPath ?? `/svgs/artist-type-logos/${index + 1}_LOGO.svg`}
                  alt={data.fullName}
                  className="w-10 h-10 dark:brightness-0 dark:invert"
                />

                {/* Name and percentage */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{data.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {info?.traits.slice(0, 2).join(', ')}
                  </div>
                </div>

                {/* Percentage */}
                <div className="text-right">
                  <div className="font-bold">{data.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">{data.points.toFixed(0)} pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero - Winner Display */}
        <WinnerHeroSection winnerId={effectiveWinnerId} percentage={winnerPercentage} />

        {/* Full Analysis Chart */}
        <FullAnalysisSection artistData={artistData} />

        {/* All Artist Types List */}
        <AllArtistTypesSection artistData={artistData} />

        {/* Share Section */}
        <ShareSection artistData={artistData} winnerId={effectiveWinnerId} />

        {/* Action Buttons */}
        <ActionsSection />
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
