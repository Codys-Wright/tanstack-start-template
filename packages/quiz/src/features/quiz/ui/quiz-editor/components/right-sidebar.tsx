'use client';

import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import type { AnalysisEngine } from '@quiz/features/analysis-engine/domain/schema.js';
import type { Quiz } from '@quiz/features/quiz/domain/schema.js';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import { Card, Chart, ScrollArea, Skeleton, type ChartConfig } from '@shadcn';
import { BarChart3Icon } from 'lucide-react';
import React from 'react';
import { LabelList, Pie, PieChart } from 'recharts';
import { AnalysisService } from '@quiz/features/analysis/domain/service.js';
import {
  artistColors,
  endingNameToArtistType,
} from '@quiz/features/analysis/ui/artist-type/artist-data-utils.js';
import { analysesAtom } from '@quiz/features/analysis/client/atoms.js';
import { responsesAtom } from '@quiz/features/responses/client/atoms.js';
import { quizzesAtom } from '@quiz/features/quiz/client/atoms.js';
import { analysisConfigAtom, reanalysisDataAtom, selectedQuizIdAtom } from '../atoms.js';
import { ArtistIcon } from './artist-icon.js';

// Chart config matching the admin AnalysisChart
const chartConfig = {
  count: {
    label: 'Count',
  },
  visionary: {
    label: 'Visionary',
    color: 'var(--artist-visionary)',
  },
  consummate: {
    label: 'Consummate',
    color: 'var(--artist-consummate)',
  },
  analyzer: {
    label: 'Analyzer',
    color: 'var(--artist-analyzer)',
  },
  tech: {
    label: 'Tech',
    color: 'var(--artist-tech)',
  },
  entertainer: {
    label: 'Entertainer',
    color: 'var(--artist-entertainer)',
  },
  maverick: {
    label: 'Maverick',
    color: 'var(--artist-maverick)',
  },
  dreamer: {
    label: 'Dreamer',
    color: 'var(--artist-dreamer)',
  },
  feeler: {
    label: 'Feeler',
    color: 'var(--artist-feeler)',
  },
  tortured: {
    label: 'Tortured',
    color: 'var(--artist-tortured)',
  },
  solo: {
    label: 'Solo',
    color: 'var(--artist-solo)',
  },
} satisfies ChartConfig;

// Helper function to get the primary artist type from analysis results (from admin chart)
const getPrimaryArtistType = (
  endingResults: ReadonlyArray<{
    endingId: string;
    points: number;
    percentage: number;
  }>,
) => {
  if (endingResults.length === 0) return null;

  // Find the result with the highest points
  const primaryResult = endingResults.reduce((prev, current) =>
    current.points > prev.points ? current : prev,
  );

  // Map endingId to full name
  const endingIdToFullName: Record<string, string> = {};
  Object.keys(endingNameToArtistType).forEach((fullName) => {
    const endingId = fullName.toLowerCase().replace(/\s+/g, '-');
    endingIdToFullName[endingId] = fullName;
  });

  return endingIdToFullName[primaryResult.endingId] ?? primaryResult.endingId;
};

// Real Analysis Chart with Card wrapper (using exact admin logic)
export const RealAnalysisChart: React.FC = () => {
  const analysisResult = useAtomValue(analysesAtom);
  const responsesResult = useAtomValue(responsesAtom);

  const chartData = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return [];
    }

    const analyses = analysisResult.value;

    // Count artist types from the most recent analysis for each response (exact admin logic)
    const artistTypeCounts: Record<string, number> = {};

    analyses.forEach((analysis) => {
      const primaryArtistType = getPrimaryArtistType(analysis.endingResults);
      if (primaryArtistType !== null) {
        const artistType = endingNameToArtistType[primaryArtistType];
        if (artistType !== undefined) {
          artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
        }
      }
    });

    // Convert to chart data format
    return Object.entries(artistTypeCounts).map(([artistType, count]) => ({
      type: artistType.toLowerCase(),
      count,
      fill: artistColors[artistType as keyof typeof artistColors],
    }));
  }, [analysisResult]);

  const totalAnalyses = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return 0;
    }
    // Use the actual count of analysis results, not the chart data count (exact admin logic)
    return analysisResult.value.length;
  }, [analysisResult, responsesResult]);

  return (
    <Card className="flex flex-col h-full p-0">
      <Card.Content className="flex-1 p-1">
        {!Result.isSuccess(analysisResult) ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        ) : (
          <Chart config={chartConfig} className="w-full h-full">
            <PieChart>
              <Chart.Tooltip cursor={false} content={<Chart.TooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="type" innerRadius={40} strokeWidth={3}>
                <LabelList
                  content={({ viewBox }) => {
                    if (
                      Boolean(viewBox) &&
                      typeof viewBox === 'object' &&
                      'cx' in viewBox &&
                      'cy' in viewBox
                    ) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 8}
                            className="fill-foreground text-xl font-bold"
                          >
                            {totalAnalyses.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 10}
                            className="fill-muted-foreground text-xs"
                          >
                            Actual
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </Chart>
        )}
      </Card.Content>
    </Card>
  );
};

export interface ReanalysisChartProps {
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  responsesResult: ReturnType<typeof responsesAtom.read>;
  selectedEngine: AnalysisEngine;
}

// Re-analysis Chart - Analyzes all responses with current engine
export const ReanalysisChart: React.FC<ReanalysisChartProps> = React.memo(
  ({ isAnalyzing = false, onReanalyze, responsesResult }) => {
    const reanalysisData = useAtomValue(reanalysisDataAtom);

    // Keep the last valid data during analysis
    const [stableData, setStableData] = React.useState<typeof reanalysisData>(null);

    React.useEffect(() => {
      if (reanalysisData !== null) {
        setStableData(reanalysisData);
      }
    }, [reanalysisData]);

    const displayData = isAnalyzing && stableData !== null ? stableData : reanalysisData;
    const displayTotal =
      displayData !== null ? displayData.reduce((sum, item) => sum + item.count, 0) : 0;

    return (
      <Card className="flex flex-col h-full p-0">
        <Card.Content className="flex-1 p-1">
          {displayData === null ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </div>
          ) : (
            <Chart config={chartConfig} className="w-full h-full">
              <PieChart>
                <Chart.Tooltip cursor={false} content={<Chart.TooltipContent hideLabel />} />
                <Pie
                  data={[...displayData]}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={40}
                  strokeWidth={3}
                  animationDuration={1600}
                  animationEasing="ease-out"
                  isAnimationActive={true}
                >
                  <LabelList
                    content={({ viewBox }) => {
                      if (
                        Boolean(viewBox) &&
                        typeof viewBox === 'object' &&
                        'cx' in viewBox &&
                        'cy' in viewBox
                      ) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 8}
                              className="fill-foreground text-xl font-bold"
                            >
                              {displayTotal.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 10}
                              className="fill-muted-foreground text-xs"
                            >
                              Current
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </Chart>
          )}
        </Card.Content>
      </Card>
    );
  },
);

// Artist Type Comparison Component
export const ArtistTypeComparison: React.FC = () => {
  const analysisResult = useAtomValue(analysesAtom);
  const reanalysisData = useAtomValue(reanalysisDataAtom);

  // Get real analysis counts
  const realCounts = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return {};
    }

    const analyses = analysisResult.value;
    const artistTypeCounts: Record<string, number> = {};

    analyses.forEach((analysis) => {
      const primaryArtistType = getPrimaryArtistType(analysis.endingResults);
      if (primaryArtistType !== null) {
        const artistType = endingNameToArtistType[primaryArtistType];
        if (artistType !== undefined) {
          artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
        }
      }
    });

    return artistTypeCounts;
  }, [analysisResult]);

  // Get engine projection counts
  const engineCounts = React.useMemo(() => {
    if (reanalysisData === null) {
      return {};
    }

    // Create endingId to fullName mapping
    const endingIdToFullName: Record<string, string> = {};
    Object.keys(endingNameToArtistType).forEach((fullName) => {
      const endingId = fullName.toLowerCase().replace(/\s+/g, '-');
      endingIdToFullName[endingId] = fullName;
    });

    const counts: Record<string, number> = {};
    reanalysisData.forEach((item) => {
      // Convert from database ID format (the-dreamer-artist) to artist type (Dreamer)
      const endingId = item.type.toLowerCase();
      const fullName = endingIdToFullName[endingId];
      if (fullName !== undefined) {
        const artistType = endingNameToArtistType[fullName];
        if (artistType !== undefined) {
          counts[artistType] = item.count;
        }
      }
    });

    return counts;
  }, [reanalysisData]);

  const artistTypes = [
    'Visionary',
    'Consummate',
    'Analyzer',
    'Tech',
    'Entertainer',
    'Maverick',
    'Dreamer',
    'Feeler',
    'Tortured',
    'Solo',
  ];

  return (
    <Card className="mt-3">
      <Card.Header className="py-2 px-3">
        <Card.Title className="text-xs text-muted-foreground font-medium">Comparison</Card.Title>
      </Card.Header>
      <Card.Content className="p-3 pt-0">
        <div className="space-y-2">
          {artistTypes.map((artistType) => {
            const engineCount = engineCounts[artistType] ?? 0;
            const realCount = realCounts[artistType] ?? 0;

            return (
              <div key={artistType} className="grid grid-cols-3 items-center gap-2 py-1">
                {/* Left - Engine Count */}
                <div className="text-right">
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {engineCount}
                  </span>
                </div>

                {/* Center - Artist Icon */}
                <div className="flex justify-center">
                  <ArtistIcon artistType={artistType.toLowerCase()} size={48} />
                </div>

                {/* Right - Real Count */}
                <div className="text-left">
                  <span className="text-sm font-mono text-green-600 dark:text-green-400">
                    {realCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-blue-600 dark:text-blue-400">Engine</span>
            <span className="text-green-600 dark:text-green-400">Real</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export interface SidebarGraphsViewProps {
  engines: ReadonlyArray<AnalysisEngine>;
  quiz: Quiz;
  selectedEngineId: string;
}

// Sidebar Graphs View Component (Compact version for sidebar)
export const SidebarGraphsView: React.FC<SidebarGraphsViewProps> = ({
  engines,
  selectedEngineId,
}) => {
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);

  // Get real analysis data from atoms
  const responsesResult = useAtomValue(responsesAtom);
  const quizzesResult = useAtomValue(quizzesAtom);
  const selectedQuizId = useAtomValue(selectedQuizIdAtom);
  const setReanalysisData = useAtomSet(reanalysisDataAtom);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Get analysis config from the left panel
  const analysisConfig = useAtomValue(analysisConfigAtom);

  // Shared reanalyze function that can be used by both components
  const handleReanalyze = React.useCallback(async () => {
    if (
      !Result.isSuccess(responsesResult) ||
      !Result.isSuccess(quizzesResult) ||
      selectedEngine === undefined
    ) {
      return;
    }

    if (selectedQuizId === '') {
      return;
    }

    setIsAnalyzing(true);

    try {
      const allResponses = responsesResult.value;
      const allQuizzes = quizzesResult.value;

      // Use the currently selected quiz version from the dropdown for analysis
      const selectedQuiz = allQuizzes.find((quiz) => quiz.id === selectedQuizId);

      if (selectedQuiz === undefined) {
        return;
      }

      // Find all "My Artist Type Quiz" versions for response filtering
      const artistTypeQuizzes = allQuizzes.filter(
        (quiz) =>
          quiz.title === 'My Artist Type Quiz' || quiz.title === 'My Artist Type Quiz (Editing)',
      );
      const artistTypeQuizIds = new Set(artistTypeQuizzes.map((q) => q.id));

      // Filter responses to only include those from "My Artist Type Quiz" versions
      const responses = allResponses.filter((response) => artistTypeQuizIds.has(response.quizId));

      const artistTypeCounts: Record<string, number> = {};

      // Process each response using the local analysis function
      for (const response of responses) {
        try {
          // selectedEngine is already checked above

          // Use AnalysisService directly like the working Typeform analysis
          try {
            const analysisResult = Effect.runSync(
              Effect.provide(
                AnalysisService.pipe(
                  Effect.flatMap((service) =>
                    service.analyzeResponse(
                      selectedEngine,
                      selectedQuiz,
                      response,
                      Config.succeed(analysisConfig),
                    ),
                  ),
                ),
                AnalysisService.Default,
              ),
            );

            // Transform the analysis result to the expected format
            const analysisResults = analysisResult.endingResults.map(
              (result: { endingId: string; percentage: number; points: number }) => ({
                artistType: endingNameToArtistType[result.endingId] ?? result.endingId,
                percentage: result.percentage,
                points: result.points,
                fullName: result.endingId,
                databaseId: result.endingId,
              }),
            );

            // Count the results - find the highest percentage result
            if (analysisResults.length > 0) {
              const winningResult = analysisResults.reduce((winner, current) =>
                current.percentage > winner.percentage ? current : winner,
              );

              // Check if all results have 0 points - this indicates an analysis error
              const allResultsHaveZeroPoints = analysisResults.every(
                (result) => result.points === 0,
              );
              if (allResultsHaveZeroPoints) {
                throw new Error(
                  `Analysis failed: All results have 0 points. This indicates a problem with the analysis engine or question matching. Response ID: ${response.id}`,
                );
              }

              const artistType = winningResult.artistType;
              artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
            }
          } catch {
            // Continue with other responses even if one fails
          }
        } catch {
          // Continue with other responses even if one fails
        }
      }

      // Convert to chart data format
      const chartData = Object.entries(artistTypeCounts).map(([artistType, count]) => ({
        type: artistType.toLowerCase(),
        count,
        fill: artistColors[artistType as keyof typeof artistColors],
      }));

      setReanalysisData([...chartData]); // Create mutable copy
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Re-analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    responsesResult,
    quizzesResult,
    selectedEngine,
    selectedQuizId,
    setReanalysisData,
    analysisConfig,
  ]);

  // Create a hash of the engine's endings to detect changes in ideal answers
  const engineEndingsHash = React.useMemo(() => {
    if (selectedEngine === undefined) return '';
    // Create a simple hash based on the endings configuration
    return JSON.stringify(
      selectedEngine.endings.map((e) => ({
        id: e.endingId,
        rules: e.questionRules.map((r) => ({
          qId: r.questionId,
          ideal: r.idealAnswers,
          primary: r.isPrimary,
        })),
      })),
    );
  }, [selectedEngine]);

  // Auto-reanalyze when config changes OR when engine ideal answers change
  React.useEffect(() => {
    if (
      Result.isSuccess(responsesResult) &&
      Result.isSuccess(quizzesResult) &&
      selectedEngine !== undefined
    ) {
      const timeoutId = setTimeout(() => {
        void handleReanalyze();
      }, 500); // 500ms debounce

      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [
    analysisConfig,
    handleReanalyze,
    responsesResult,
    quizzesResult,
    selectedEngine,
    engineEndingsHash,
  ]);

  if (selectedEngine === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <BarChart3Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No analysis engine selected</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-3">
        {/* Re-analysis Chart - Top */}
        <div className="h-[300px]">
          <ReanalysisChart
            responsesResult={responsesResult}
            selectedEngine={selectedEngine}
            onReanalyze={handleReanalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Real Analysis Distribution */}
        <div className="h-[300px]">
          <RealAnalysisChart />
        </div>

        {/* Artist Type Comparison */}
        <ArtistTypeComparison />
      </div>
    </ScrollArea>
  );
};

export interface RightSidebarProps {
  engines: ReadonlyArray<AnalysisEngine>;
  quiz: Quiz | undefined;
  selectedEngineId: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ engines, quiz, selectedEngineId }) => {
  if (quiz === undefined) {
    return (
      <div className="flex h-full flex-col border-l border-border/50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col border-l border-border/50">
      {/* Sidebar Content */}
      <SidebarGraphsView quiz={quiz} engines={engines} selectedEngineId={selectedEngineId} />
    </div>
  );
};
