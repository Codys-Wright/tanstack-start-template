'use client';

import { Chart, cn } from '@shadcn';
import React from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

// Import our artist data utilities
import {
  getArtistColorHex,
  getArtistIconPath,
  useNormalizedArtistData,
  type ArtistData,
} from './artist-data-utils.js';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ArtistRadarChartProps = {
  data?: Array<ArtistData>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  iconSize?: number;
  beta?: number;
};

type IconPosition = {
  databaseId: string;
  size: number;
  x: number;
  y: number;
  _left?: string;
  _top?: string;
};

type ChartConfig = {
  percentage: {
    label: string;
    color: string;
  };
};

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_RADIUS_MULTIPLIER = 0.9;
const ICON_SIZE_PERCENTAGE = 0.15;

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

type ArtistIconProps = {
  alt?: string;
  className?: string;
  iconPath?: string | null;
  size?: number;
};

const ArtistIcon: React.FC<ArtistIconProps> = ({
  alt = 'Artist Icon',
  className,
  iconPath,
  size = 40,
}) => {
  const [loadError, setLoadError] = React.useState(false);

  if (iconPath === null || iconPath === undefined || iconPath === '' || loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white',
          className,
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={alt}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        aspectRatio: '1 / 1',
        flexShrink: 0,
      }}
    >
      <img
        src={iconPath}
        alt={alt}
        className="rounded-full dark:brightness-0 dark:invert"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          aspectRatio: '1 / 1',
        }}
        onError={() => {
          setLoadError(true);
        }}
      />
    </div>
  );
};

type CentralLogoProps = {
  className?: string;
};

const CentralLogo: React.FC<CentralLogoProps> = ({ className }) => (
  <div
    className={cn(
      'absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform',
      className,
    )}
  >
    {/* Circular background to block chart behind */}
    <div
      className="bg-background absolute inset-0 rounded-full"
      style={{
        width: '50px',
        height: '50px',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
    {/* Logo image */}
    <img
      src="/svgs/MyArtistTypeLogo.svg"
      alt="My Artist Type Logo"
      className="relative z-10 h-[50px] w-[50px] dark:brightness-0 dark:invert"
      style={{
        objectFit: 'contain',
      }}
    />
  </div>
);

// =============================================================================
// HOOKS
// =============================================================================

type UseIconPositionsOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  data: ReadonlyArray<ArtistData>;
  iconSize: number;
};

const useIconPositions = ({
  containerRef,
  data,
  iconSize,
}: UseIconPositionsOptions): Array<IconPosition> => {
  const [positions, setPositions] = React.useState<Array<IconPosition>>([]);

  React.useEffect(() => {
    const calculateIconPositions = () => {
      if (containerRef.current === null || !Array.isArray(data) || data.length === 0) {
        setPositions([]);
        return;
      }

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) return;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(centerX, centerY) * ICON_RADIUS_MULTIPLIER;

      const newPositions: Array<IconPosition> = data.map((item: ArtistData, index: number) => {
        const angle = (index / data.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          databaseId: item.databaseId,
          size: iconSize,
          x,
          y,
        };
      });

      setPositions(newPositions);
    };

    // Calculate positions immediately
    calculateIconPositions();

    // Recalculate on resize
    const resizeHandler = () => {
      calculateIconPositions();
    };
    window.addEventListener('resize', resizeHandler);

    // Use ResizeObserver for more reliable updates
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current !== null && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        calculateIconPositions();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (resizeObserver !== null) resizeObserver.disconnect();
    };
  }, [data, containerRef, iconSize]);

  return positions;
};

type UseBlendedColorOptions = {
  data: ReadonlyArray<ArtistData>;
};

const useBlendedColor = ({ data }: UseBlendedColorOptions): string => {
  return React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return '#000000';

    try {
      const totalPercentage = data.reduce(
        (sum: number, item: ArtistData) => sum + item.percentage,
        0,
      ) as number;
      if (totalPercentage <= 0) return '#000000';

      // Convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result === null) return { r: 0, g: 0, b: 0 };
        const r = Number.parseInt(result[1] ?? '0', 16);
        const g = Number.parseInt(result[2] ?? '0', 16);
        const b = Number.parseInt(result[3] ?? '0', 16);
        return { r, g, b };
      };

      // Get computed CSS color value with dark mode support
      const getComputedArtistColor = (artistType: string): string => {
        try {
          // Use the new dynamic conversion function
          return getArtistColorHex(artistType);
        } catch {
          return getArtistColorHex(artistType);
        }
      };

      // Calculate weighted RGB values
      let rSum = 0,
        gSum = 0,
        bSum = 0;

      data.forEach((item: ArtistData) => {
        const weight = item.percentage / totalPercentage;
        const artistType = item.artistType.length > 0 ? item.artistType : 'Analyzer';
        const colorValue = getComputedArtistColor(artistType);
        const rgb = hexToRgb(colorValue);

        rSum += rgb.r * weight;
        gSum += rgb.g * weight;
        bSum += rgb.b * weight;
      });

      const r = Math.round(rSum);
      const g = Math.round(gSum);
      const b = Math.round(bSum);

      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
      return '#000000';
    }
  }, [data]);
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type LoadingStateProps = {
  className?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn('flex h-full items-center justify-center', className)}>
    <div className="flex items-center gap-2 text-gray-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Loading chart data...
    </div>
  </div>
);

// Empty tick component to hide the default ticks
const EmptyTick = () => <g />;

export const ArtistRadarChart: React.FC<ArtistRadarChartProps> = ({
  beta,
  className,
  data,
  iconSize,
  showIcons: _showIcons = true,
  size: _size = 'md',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Check if we have real data (not just empty/default data)
  const hasRealData = React.useMemo(() => {
    return Array.isArray(data) && data.length > 0 && data.some((item) => item.points > 0);
  }, [data]);

  // Normalize and memoize the chart data
  const chartData = useNormalizedArtistData(data, {
    ...(beta !== undefined && { beta }),
    ensureComplete: true,
    normalizeFrom: 'auto',
    preserveBetaEffect: false, // We'll apply beta transformation here instead
  });

  // If no real data, ensure all percentages are 0
  const finalChartData = React.useMemo(() => {
    if (!hasRealData) {
      return chartData.map((item) => ({
        ...item,
        percentage: 0,
      }));
    }
    return chartData;
  }, [chartData, hasRealData]);

  // Calculate blended color for the radar fill
  const blendedColor = useBlendedColor({ data: chartData });

  // Calculate icon positions
  const calculatedIconSize = React.useMemo(() => {
    if (iconSize !== undefined) return iconSize;
    if (containerRef.current === null) return 40;

    const rect = containerRef.current.getBoundingClientRect();
    return Math.min(rect.width, rect.height) * ICON_SIZE_PERCENTAGE;
  }, [iconSize]);

  const iconPositions = useIconPositions({
    containerRef,
    data: chartData,
    iconSize: calculatedIconSize,
  });

  // Create chart configuration
  const chartConfig: ChartConfig = React.useMemo(
    () => ({
      percentage: {
        label: 'Percentage',
        color: blendedColor,
      },
    }),
    [blendedColor],
  );

  // Loading state
  if (!Array.isArray(finalChartData) || finalChartData.length === 0) {
    return <LoadingState className={className ?? ''} />;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full', className)}
      style={{ aspectRatio: '1 / 1.1' }}
    >
      <div className="relative h-full w-full">
        <Chart config={chartConfig} className="h-full w-full">
          <RadarChart
            data={finalChartData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
            innerRadius={30}
          >
            <Chart.Tooltip
              cursor={false}
              wrapperStyle={{ zIndex: 9999 }}
              content={
                <Chart.TooltipContent
                  indicator="line"
                  formatter={(value: unknown, _name: unknown, props: unknown) => {
                    const item = (props as { payload: ArtistData }).payload;
                    const numValue = typeof value === 'number' ? value : 0;
                    return [`${numValue}% (${item.points} pts)`, item.fullName];
                  }}
                />
              }
            />
            <PolarAngleAxis dataKey="artistType" tick={EmptyTick} />
            <PolarGrid />
            <Radar
              dataKey="percentage"
              fill={blendedColor}
              fillOpacity={0.6}
              stroke={blendedColor}
              strokeWidth={2}
              style={{
                transition:
                  'fill 800ms cubic-bezier(0.4, 0, 0.2, 1), stroke 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </RadarChart>
        </Chart>

        {/* Manually positioned icons - with null check and fallback positions */}
        {Array.isArray(iconPositions) &&
          (iconPositions.length > 0
            ? iconPositions
            : chartData.map((item: ArtistData, index) => {
                const angle = (index / chartData.length) * 2 * Math.PI - Math.PI / 2;
                const fallbackRadiusPx = 140;
                const fallbackPosition: IconPosition = {
                  databaseId: item.databaseId,
                  size: Math.max(48, Math.min(72, 0.15 * 400)),
                  x: Number.NaN,
                  y: Number.NaN,
                  _left: `calc(50% + ${Math.cos(angle) * fallbackRadiusPx}px)`,
                  _top: `calc(50% + ${Math.sin(angle) * fallbackRadiusPx}px)`,
                };
                return fallbackPosition;
              })
          ).map((position, index) => {
            const iconPath = getArtistIconPath(position.databaseId);

            return (
              <div
                key={`${position.databaseId}-${index}`}
                className="pointer-events-none absolute z-50"
                style={{
                  left: position._left ?? (Number.isNaN(position.x) ? 0 : position.x),
                  top: position._top ?? (Number.isNaN(position.y) ? 0 : position.y),
                  width: `${position.size}px`,
                  height: `${position.size}px`,
                  transform: 'translate(-50%, -50%)', // Center the icon on the calculated position
                  aspectRatio: '1 / 1', // Ensure container is square
                }}
              >
                <ArtistIcon iconPath={iconPath ?? null} size={position.size} />
              </div>
            );
          })}
      </div>

      {/* Central logo */}
      <CentralLogo />
    </div>
  );
};

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type { ArtistData };
