'use client';

import { Result, useAtom } from '@effect-atom/atom-react';
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, Chart, Select, ToggleGroup, type ChartConfig } from '@shadcn';
import { responsesAtom } from '../../responses/client/atoms.js';

// Helper function to get the response date (now just uses createdAt since we set it properly in the database)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResponseDate(response: any): Date {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  return new Date(response.createdAt.epochMillis);
}

const chartConfig = {
  completed: {
    label: 'Completed',
    color: 'var(--chart-1)',
  },
  inProgress: {
    label: 'In Progress',
    color: 'var(--chart-2)',
  },
  notStarted: {
    label: 'Not Started',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function ResponsesOverTimeChart() {
  const [timeRange, setTimeRange] = React.useState('all');
  const [responsesResult] = useAtom(responsesAtom);

  const chartData = React.useMemo(() => {
    if (!Result.isSuccess(responsesResult)) {
      return [];
    }

    const responses = responsesResult.value;

    // Group responses by date
    const dateGroups: Record<
      string,
      { completed: number; inProgress: number; notStarted: number }
    > = {};

    responses.forEach((response) => {
      const responseDate = getResponseDate(response);
      const dateKey = responseDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (dateKey && dateGroups[dateKey] === undefined) {
        dateGroups[dateKey] = { completed: 0, inProgress: 0, notStarted: 0 };
      }

      if (!dateKey) return;
      const group = dateGroups[dateKey];
      if (group === undefined) return;

      // Determine status based on session metadata
      if (response.sessionMetadata.completedAt !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        group.completed++;
      } else if (response.sessionMetadata.startedAt !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        group.inProgress++;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        group.notStarted++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(dateGroups)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [responsesResult]);

  const filteredData = React.useMemo(() => {
    if (chartData.length === 0) return [];

    if (timeRange === 'all') {
      // Show all data from 2024 onwards
      const startOf2024 = new Date('2024-01-01');
      return chartData.filter((item) => {
        const date = new Date(item.date);
        return date >= startOf2024;
      });
    }

    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [chartData, timeRange]);

  if (!Result.isSuccess(responsesResult)) {
    return (
      <Card className="@container/card w-full h-full flex flex-col">
        <Card.Header>
          <Card.Title>Quiz Responses Over Time</Card.Title>
          <Card.Description>Loading response data...</Card.Description>
        </Card.Header>
        <Card.Content className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="@container/card w-full h-full flex flex-col">
      <Card.Header>
        <Card.Title>Quiz Responses Over Time</Card.Title>
        <Card.Description>
          <span className="hidden @[540px]/card:block">Real-time response completion trends</span>
          <span className="@[540px]/card:hidden">Response trends</span>
        </Card.Description>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value);
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroup.Item value="all">All (2024+)</ToggleGroup.Item>
            <ToggleGroup.Item value="90d">Last 3 months</ToggleGroup.Item>
            <ToggleGroup.Item value="30d">Last 30 days</ToggleGroup.Item>
            <ToggleGroup.Item value="7d">Last 7 days</ToggleGroup.Item>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <Select.Trigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <Select.Value placeholder="Last 3 months" />
            </Select.Trigger>
            <Select.Content className="rounded-xl">
              <Select.Item value="all" className="rounded-lg">
                All (2024+)
              </Select.Item>
              <Select.Item value="90d" className="rounded-lg">
                Last 3 months
              </Select.Item>
              <Select.Item value="30d" className="rounded-lg">
                Last 30 days
              </Select.Item>
              <Select.Item value="7d" className="rounded-lg">
                Last 7 days
              </Select.Item>
            </Select.Content>
          </Select>
        </div>
      </Card.Header>
      <Card.Content className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        <Chart config={chartConfig} className=" w-full max-h-56">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillInProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillNotStarted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(String(value));

                // Show year only at start of each year when time range spans more than a year
                if (timeRange === 'all') {
                  const isStartOfYear = date.getMonth() === 0 && date.getDate() <= 7;
                  if (isStartOfYear) {
                    return date.getFullYear().toString();
                  }
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }

                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <Chart.Tooltip
              cursor={false}
              content={
                <Chart.TooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(String(value));

                    // Show year when time range spans more than a year
                    if (timeRange === 'all') {
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                      });
                    }

                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="notStarted"
              type="natural"
              fill="url(#fillNotStarted)"
              stroke="var(--chart-3)"
              stackId="a"
            />
            <Area
              dataKey="inProgress"
              type="natural"
              fill="url(#fillInProgress)"
              stroke="var(--chart-2)"
              stackId="a"
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--chart-1)"
              stackId="a"
            />
          </AreaChart>
        </Chart>
      </Card.Content>
    </Card>
  );
}
