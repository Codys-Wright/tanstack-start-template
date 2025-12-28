"use client";

import { Atom, useAtomValue } from "@effect-atom/atom-react";
import { cn } from "@shadcn";
import React from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

// Import our chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@shadcn";

// Import our artist data utilities
import {
  getArtistColorHex,
  useNormalizedArtistData,
  type ArtistData,
} from "./artist-data-utils.js";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

type EnrichedChartData = ArtistData & {
  readonly displayPercentage: number;
  readonly subtitle?: string | null;
  readonly elevatorPitch?: string | null;
};

type ArtistBarChartProps = {
  readonly data?: ReadonlyArray<ArtistData>;
  readonly className?: string;
  readonly maxItems?: number;
  readonly height?: string;
  readonly beta?: number;
};

type ChartSizing = {
  readonly fontSize: string;
  readonly tickMargin: number;
  readonly yAxisWidth: number;
  readonly maxLabelLength: number;
  readonly chartFontSize: number;
  readonly topMargin: number;
  readonly bottomMargin: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_ITEMS = 10;
const DEFAULT_HEIGHT = "h-32";
const PER_ROW_PX = 28;
const MIN_HEIGHT_PX = 180;

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

type EmptyStateProps = {
  readonly className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div
    className={cn("flex items-center justify-center py-4 text-sm text-muted-foreground", className)}
  >
    No artist type data available
  </div>
);

// =============================================================================
// ATOMS & DERIVED STATE
// =============================================================================

// Atom for enriched chart data
const enrichedChartDataAtom = Atom.family(
  (params: { maxItems: number; normalizedData: ReadonlyArray<ArtistData> }) =>
    Atom.make((_get) => {
      const { maxItems, normalizedData } = params;

      // Deduplicate and sanitize
      const seen = new Set<string>();
      const safe = normalizedData.filter((item, idx) => {
        const id = item.databaseId === "" ? `unknown-${idx}` : item.databaseId;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      const enriched = safe
        .map(
          (item): EnrichedChartData => ({
            ...item,
            displayPercentage:
              item.percentage === 0 ? 0.5 : Math.min(100, Math.max(0, item.percentage)),
            subtitle: null,
            elevatorPitch: null,
          }),
        )
        .sort((a, b) => b.percentage - a.percentage);

      // Respect maxItems limit
      return enriched.slice(0, Math.max(0, Math.min(maxItems, enriched.length)));
    }),
);

// Atom for chart sizing
const chartSizingAtom = Atom.family((itemCount: number) =>
  Atom.make(() => {
    if (itemCount >= 8) {
      // Many items - use smallest text and minimal spacing
      return {
        fontSize: "text-xs",
        tickMargin: 2,
        yAxisWidth: 40,
        maxLabelLength: 10,
        chartFontSize: 11,
        topMargin: 2,
        bottomMargin: 2,
      } as ChartSizing;
    }

    if (itemCount >= 6) {
      // Medium number of items
      return {
        fontSize: "text-xs",
        tickMargin: 2,
        yAxisWidth: 45,
        maxLabelLength: 12,
        chartFontSize: 12,
        topMargin: 3,
        bottomMargin: 3,
      } as ChartSizing;
    }

    if (itemCount >= 4) {
      // Few items - can use larger text
      return {
        fontSize: "text-sm",
        tickMargin: 2,
        yAxisWidth: 50,
        maxLabelLength: 14,
        chartFontSize: 13,
        topMargin: 5,
        bottomMargin: 5,
      } as ChartSizing;
    }

    // Very few items - largest text
    return {
      fontSize: "text-sm",
      tickMargin: 2,
      yAxisWidth: 55,
      maxLabelLength: 16,
      chartFontSize: 14,
      topMargin: 8,
      bottomMargin: 8,
    } as ChartSizing;
  }),
);

// Atom for dynamic sizing
const dynamicSizingAtom = Atom.family(
  (params: { data: ReadonlyArray<ArtistData>; sizing: ChartSizing }) =>
    Atom.make(() => {
      const { data } = params;
      const rows = data.length;
      const containerHeightPx = Math.max(MIN_HEIGHT_PX, rows * PER_ROW_PX);

      // Compute dynamic y-axis width for labels - use minimal space
      const longestLabelChars = data.reduce((len, item) => {
        const label = item.artistType === "" ? "" : item.artistType;
        return Math.max(len, label.length);
      }, 0);

      const dynamicYAxisWidth = Math.max(40, longestLabelChars * 6 + 12);

      return {
        containerHeightPx,
        dynamicYAxisWidth,
      };
    }),
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ArtistBarChart = React.memo<ArtistBarChartProps>(
  ({
    beta,
    className = "",
    data,
    height: _height = DEFAULT_HEIGHT,
    maxItems = DEFAULT_MAX_ITEMS,
  }) => {
    // Normalize the data using our React hook
    const normalizedData = useNormalizedArtistData(data, {
      ...(beta !== undefined && { beta }),
      ensureComplete: true,
      normalizeFrom: "auto",
      preserveBetaEffect: false, // We'll apply beta transformation here instead
    });

    // Use Effect Atom for reactive derived state
    const enrichedData = useAtomValue(enrichedChartDataAtom({ maxItems, normalizedData }));

    const sizing = useAtomValue(chartSizingAtom(enrichedData.length));

    const { containerHeightPx, dynamicYAxisWidth } = useAtomValue(
      dynamicSizingAtom({ data: enrichedData, sizing }),
    );

    // Handle empty state
    if (enrichedData.length === 0) {
      return <EmptyState className={className} />;
    }

    // Create chart configuration
    const chartConfig: ChartConfig = React.useMemo(
      () => ({
        percentage: {
          label: "Percentage",
          color: "#8884d8",
        },
      }),
      [],
    );

    return (
      <div className={cn(sizing.fontSize, className)} style={{ height: `${containerHeightPx}px` }}>
        <ChartContainer config={chartConfig} className="h-full w-full max-w-full overflow-hidden">
          <BarChart
            data={enrichedData}
            layout="vertical"
            margin={{
              left: 2,
              right: 8,
              top: sizing.topMargin,
              bottom: sizing.bottomMargin,
            }}
            maxBarSize={200}
          >
            <XAxis type="number" dataKey="displayPercentage" hide domain={[0, 100]} />
            <YAxis
              dataKey="artistType"
              type="category"
              tickLine={false}
              tickMargin={2}
              axisLine={false}
              tickFormatter={(value: string) => value}
              width={dynamicYAxisWidth}
              fontSize={sizing.chartFontSize}
              orientation="left"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(_value: unknown, _name: unknown, props: unknown) => {
                    const item = (props as { payload: EnrichedChartData }).payload;
                    // Use original percentage for tooltip (not beta-transformed)
                    const tooltipPercentage = item.originalPercentage ?? item.percentage;
                    const formattedPoints = item.points.toFixed(2);
                    return [
                      `${tooltipPercentage.toFixed(1)}% (${formattedPoints} pts)`,
                      item.fullName,
                    ];
                  }}
                />
              }
            />
            <Bar
              dataKey="displayPercentage"
              radius={[0, 3, 3, 0]}
              animationDuration={1600}
              animationEasing="ease-out"
              isAnimationActive={true}
            >
              {enrichedData.map((entry) => {
                const artistType = entry.artistType;
                // Use hex colors with dark mode support for better chart library compatibility
                const fillColor = getArtistColorHex(artistType);
                return <Cell key={`${artistType}-bar`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    );
  },
);

ArtistBarChart.displayName = "ArtistBarChart";
