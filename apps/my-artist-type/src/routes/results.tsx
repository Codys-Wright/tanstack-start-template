import { createFileRoute, useSearch } from '@tanstack/react-router';
import { MyResponsePage, MyResponsePageLoading, decodeResultsFromShare } from '@quiz';
import React from 'react';

/**
 * Shared Results route - displays quiz results decoded from URL parameter.
 * This page allows users to view shared results without database access.
 *
 * URL format: /results?d=<base64-encoded-data>
 */
export const Route = createFileRoute('/results')({
  validateSearch: (search: Record<string, unknown>): { d?: string } => {
    return {
      d: typeof search.d === 'string' ? search.d : undefined,
    };
  },
  component: ResultsPageWrapper,
  pendingComponent: ResultsPagePending,
});

function ResultsPageWrapper() {
  const { d } = useSearch({ from: '/results' });
  const [decodedResults, setDecodedResults] = React.useState<{
    artistData: any[];
    winnerId: string;
    sharedAt?: Date;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!d) {
      setError('No results data found in URL');
      return;
    }

    const decoded = decodeResultsFromShare(d);
    if (!decoded) {
      setError('Failed to decode results from URL');
      return;
    }

    setDecodedResults(decoded);
  }, [d]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Invalid Results Link</h1>
          <p className="text-muted-foreground">{error}</p>
          <a href="/quiz" className="text-primary underline">
            Take the quiz yourself
          </a>
        </div>
      </div>
    );
  }

  if (!decodedResults) {
    return (
      <div className="min-h-screen pt-24">
        <MyResponsePageLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MyResponsePage artistData={decodedResults.artistData} winnerId={decodedResults.winnerId} />
    </div>
  );
}

function ResultsPagePending() {
  return (
    <div className="min-h-screen pt-24">
      <MyResponsePageLoading />
    </div>
  );
}
