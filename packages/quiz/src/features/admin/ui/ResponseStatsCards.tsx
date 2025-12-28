import type { Result } from '@effect-atom/atom-react';
import type { QuizResponse } from '../../responses/schema.js';
import { Card } from '@ui/shadcn';
import { BarChart3Icon, CheckCircleIcon, ClockIcon, UsersIcon } from 'lucide-react';
import React from 'react';

type ResponseStatsCardsProps = {
  responsesResult: Result.Result<ReadonlyArray<QuizResponse>, unknown>;
};

// Response Statistics Cards Component
export const ResponseStatsCards: React.FC<ResponseStatsCardsProps> = ({ responsesResult }) => {
  const stats = React.useMemo(() => {
    if (responsesResult._tag !== 'Success') {
      return {
        totalResponses: 0,
        completedResponses: 0,
        averageDuration: 0,
        completionRate: 0,
      };
    }

    const responses = responsesResult.value;
    const totalResponses = responses.length;
    const completedResponses = responses.filter(
      (r) => r.sessionMetadata.completedAt !== undefined,
    ).length;

    const totalDuration = responses.reduce((sum, r) => {
      return sum + (r.sessionMetadata.totalDurationMs ?? 0);
    }, 0);

    const averageDuration = totalResponses > 0 ? totalDuration / totalResponses : 0;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    return {
      totalResponses,
      completedResponses,
      averageDuration: Math.round(averageDuration / 1000), // Convert to seconds
      completionRate: Math.round(completionRate),
    };
  }, [responsesResult]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Responses */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
            <p className="text-2xl font-bold">{stats.totalResponses}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      {/* Completed Responses */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completedResponses}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      {/* Completion Rate */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <BarChart3Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      {/* Average Duration */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
            <p className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>
  );
};
