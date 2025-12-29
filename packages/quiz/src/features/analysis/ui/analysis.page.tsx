import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import type { AnalysisEngineId } from '@/features/analysis-engine/domain/schema.js';
import type { ResponseId } from '@/features/responses/domain/schema.js';
import { Badge, Button, Card, DropdownMenu } from '@shadcn';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import { ArtistTypeGraphCard } from '@/features/active-quiz/components/artist-type/artist-type-graph-card.js';
import { enginesAtom } from '@/features/analysis-engine/client/atoms.js';
import { responsesAtom } from '@/features/responses/client/atoms.js';
import {
  analysesAtom,
  analysisSummaryAtom,
  analyzeResponseWithServiceAtom,
  getAnalysisSummaryWithServiceAtom,
} from '../client/atoms.js';
import { transformAnalysisToArtistData } from '../use-analysis-artist-data.js';

// PageContainer component with padding and layout
type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div className="container mx-auto px-4 py-8 max-w-6xl">{children}</div>
);

// Success View Component
const SuccessView: React.FC = () => {
  const [selectedResponseId, setSelectedResponseId] = useState<string>('');
  const [selectedEngineId, setSelectedEngineId] = useState<string>('');

  // Get analysis results
  const summaryResult = useAtomValue(analysisSummaryAtom);
  const allAnalysisResult = useAtomValue(analysesAtom);

  // Get responses and engines for dropdowns
  const responsesResult = useAtomValue(responsesAtom);
  const enginesResult = useAtomValue(enginesAtom);

  // Function setters for service-based analysis
  const analyzeResponse = useAtomSet(analyzeResponseWithServiceAtom);
  const getAnalysisSummary = useAtomSet(getAnalysisSummaryWithServiceAtom);

  // Handler functions
  const handleGetAnalysis = () => {
    if (selectedResponseId !== '' && selectedEngineId !== '') {
      analyzeResponse({
        responseId: selectedResponseId as ResponseId,
        engineId: selectedEngineId as AnalysisEngineId,
      });
    }
  };

  const handleGetSummary = () => {
    if (selectedEngineId !== '') {
      getAnalysisSummary({ engineId: selectedEngineId as AnalysisEngineId });
    }
  };

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
          <p className="text-muted-foreground">
            View and manage analysis results for quiz responses.
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <Card.Header>
          <Card.Title>Analysis Controls</Card.Title>
          <Card.Description>
            Select a response and analysis engine to view analysis results
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Response</label>
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-between"
                    disabled={!Result.isSuccess(responsesResult)}
                  >
                    {Result.isSuccess(responsesResult) && selectedResponseId !== ''
                      ? (() => {
                          const selectedResponse = responsesResult.value.find(
                            (r) => r.id === selectedResponseId,
                          );
                          return selectedResponse !== undefined
                            ? `${selectedResponse.id.slice(0, 8)}... - ${new Date(
                                selectedResponse.createdAt.epochMillis,
                              ).toLocaleDateString()}`
                            : 'Select a response...';
                        })()
                      : Result.isFailure(responsesResult)
                        ? 'Failed to load responses'
                        : 'Loading responses...'}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenu.Label>Available Responses</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  {Result.isSuccess(responsesResult) &&
                    responsesResult.value.map((response) => (
                      <DropdownMenu.Item
                        key={response.id}
                        onClick={() => {
                          setSelectedResponseId(response.id);
                        }}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {response.id.slice(0, 8)}... -{' '}
                          {new Date(response.createdAt.epochMillis).toLocaleDateString()}
                        </span>
                        {selectedResponseId === response.id && (
                          <CheckIcon className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
            <div>
              <label className="text-sm font-medium">Analysis Engine</label>
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-between"
                    disabled={!Result.isSuccess(enginesResult)}
                  >
                    {Result.isSuccess(enginesResult) && selectedEngineId !== ''
                      ? (() => {
                          const selectedEngine = enginesResult.value.find(
                            (e) => e.id === selectedEngineId,
                          );
                          return selectedEngine !== undefined
                            ? `${selectedEngine.name} v${selectedEngine.version}`
                            : 'Select an engine...';
                        })()
                      : Result.isFailure(enginesResult)
                        ? 'Failed to load engines'
                        : 'Loading engines...'}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenu.Label>Available Analysis Engines</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  {Result.isSuccess(enginesResult) &&
                    enginesResult.value.map((engine) => (
                      <DropdownMenu.Item
                        key={engine.id}
                        onClick={() => {
                          setSelectedEngineId(engine.id);
                        }}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {engine.name} v{engine.version.semver}
                        </span>
                        {selectedEngineId === engine.id && (
                          <CheckIcon className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              disabled={
                selectedResponseId === '' ||
                selectedEngineId === '' ||
                !Result.isSuccess(responsesResult) ||
                !Result.isSuccess(enginesResult)
              }
              onClick={handleGetAnalysis}
            >
              Get Analysis
            </Button>
            <Button
              variant="outline"
              disabled={selectedEngineId === '' || !Result.isSuccess(enginesResult)}
              onClick={handleGetSummary}
            >
              Get Summary
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* All Analysis Results */}
      {Result.isSuccess(allAnalysisResult) && allAnalysisResult.value.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">All Analysis Results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {allAnalysisResult.value.map((analysis) => {
              const artistData = transformAnalysisToArtistData(analysis);
              return (
                <div key={analysis.id} className="space-y-4">
                  {/* Analysis Metadata */}
                  <Card>
                    <Card.Header>
                      <div className="flex items-center justify-between">
                        <div>
                          <Card.Title className="text-lg">
                            Analysis {analysis.id.slice(0, 8)}...
                          </Card.Title>
                          <Card.Description>
                            Engine: {analysis.engineId} v{analysis.engineVersion.semver}
                          </Card.Description>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {new Date(analysis.analyzedAt.epochMillis).toLocaleString()}
                          </Badge>
                          <Badge variant={analysis.deletedAt === null ? 'default' : 'destructive'}>
                            {analysis.deletedAt === null ? 'Active' : 'Deleted'}
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Response:</span>{' '}
                          {analysis.responseId.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">Endings:</span>{' '}
                          {analysis.endingResults.length}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(analysis.createdAt.epochMillis).toLocaleString()}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>

                  {/* Artist Type Graph Card */}
                  <ArtistTypeGraphCard
                    data={artistData}
                    showBarChart={true}
                    barChartHeight="h-48"
                    barChartMaxItems={10}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Analysis Results */}
      {Result.isSuccess(allAnalysisResult) && allAnalysisResult.value.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Analysis Results</h2>
          <Card>
            <Card.Content className="p-8 text-center">
              <p className="text-muted-foreground">No analysis results found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Use the controls above to analyze a response with an analysis engine.
              </p>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Analysis Summary */}
      {Result.isSuccess(summaryResult) && summaryResult.value !== null && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Analysis Summary</h2>
          <Card>
            <Card.Header>
              <Card.Title>Engine Summary</Card.Title>
              <Card.Description>
                Engine: {summaryResult.value.engineId} v{summaryResult.value.engineVersion.semver}
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Responses:</span>{' '}
                    {summaryResult.value.totalResponses}
                  </div>
                  <div>
                    <span className="font-medium">Generated At:</span>{' '}
                    {new Date(summaryResult.value.generatedAt.epochMillis).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </main>
  );
};

// Error View Component
const ErrorView: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <p>Something went wrong...</p>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </div>
    </div>
  );
};

// Main Analysis Page Component
export const AnalysisPage: React.FC = () => {
  const allAnalysisResult = useAtomValue(analysesAtom);

  return (
    <PageContainer>
      {Result.isSuccess(allAnalysisResult) ? (
        <SuccessView />
      ) : Result.isFailure(allAnalysisResult) ? (
        <ErrorView />
      ) : (
        <p>Loading...</p>
      )}
    </PageContainer>
  );
};
