'use client';

import { BackgroundRippleEffect } from '@components';
import { Chart, cn, type ChartConfig } from '@shadcn';
import { motion } from 'motion/react';
import React from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

import {
  type ArtistData,
  getArtistColorHex,
  getArtistIconPath,
  useNormalizedArtistData,
} from './artist-data-utils.js';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ArtistTypeAmbientBackgroundProps = {
  /** Original data (used to derive subtle correlation) */
  data?: Array<ArtistData>;

  /** Blur intensity for the entire container (default: 14) */
  blurAmount?: number;

  /** Blur intensity for the radar chart specifically (default: 20) */
  chartBlur?: number;

  /** Overall opacity (default: 0.4) */
  opacity?: number;

  /** Opacity for the chart fill specifically (default: 0.6) */
  chartOpacity?: number;

  /** How much jitter/randomization to apply (0-1, default: 0.5 for medium) */
  randomization?: number;

  /** Show icons (default: true) */
  showIcons?: boolean;

  /** Icon blur amount (default: 4) */
  iconBlur?: number;

  /** Icon opacity (default: 0.6) */
  iconOpacity?: number;

  /** Enable edge fade gradient (default: true) */
  fadeEdges?: boolean;

  className?: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_RADIUS_MULTIPLIER = 0.92; // Icons positioned at 92% of radius (outside the chart)
const BASE_SIZE_DESKTOP = 1400; // Very large base size for the ambient visualization on desktop
const BASE_SIZE_MOBILE = 800; // Smaller size for mobile to fit icons on screen
const ROTATION_DURATION = 120; // 120 seconds for full rotation (very slow)
const CHART_MARGIN = 70; // Margin around the radar chart to keep it away from icons

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Stable color shuffle mapping - maps each artist type index to a different artist type's color
// This shuffles which colors appear but stays consistent across renders
const COLOR_SHUFFLE_MAP = [5, 2, 8, 0, 7, 3, 9, 1, 4, 6]; // e.g., index 0 (Visionary) uses index 5 (Maverick) color

/**
 * Prepare ambient data - uses real percentages but shuffles the artist type
 * associations for color purposes. The graph shape is real, but colors are misleading.
 */
const prepareAmbientData = (data: ReadonlyArray<ArtistData>): Array<ArtistData> => {
  return data.map((item, index) => {
    // Get the shuffled index for color lookup
    const shuffledIndex = COLOR_SHUFFLE_MAP[index % COLOR_SHUFFLE_MAP.length] ?? index;
    const shuffledItem = data[shuffledIndex];

    return {
      ...item,
      // Keep the real percentage (graph shape is accurate)
      percentage: item.percentage,
      points: item.points,
      // Swap the artistType for color lookup purposes
      artistType: shuffledItem?.artistType ?? item.artistType,
    };
  });
};

/**
 * Calculate blended color from ambient data
 */
const calculateBlendedColor = (data: ReadonlyArray<ArtistData>): string => {
  if (data.length === 0) return '#6366f1';

  const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage <= 0) return '#6366f1';

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result === null) return { r: 128, g: 128, b: 128 };
    return {
      r: Number.parseInt(result[1] ?? '80', 16),
      g: Number.parseInt(result[2] ?? '80', 16),
      b: Number.parseInt(result[3] ?? '80', 16),
    };
  };

  let rSum = 0,
    gSum = 0,
    bSum = 0;

  data.forEach((item) => {
    const weight = item.percentage / totalPercentage;
    const colorHex = getArtistColorHex(item.artistType);
    const rgb = hexToRgb(colorHex);

    rSum += rgb.r * weight;
    gSum += rgb.g * weight;
    bSum += rgb.b * weight;
  });

  const r = Math.round(rSum);
  const g = Math.round(gSum);
  const b = Math.round(bSum);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

type AmbientIconProps = {
  iconPath: string | null;
  size: number;
  blur: number;
  opacity: number;
  x: number;
  y: number;
};

const AmbientIcon: React.FC<AmbientIconProps> = ({ iconPath, size, blur, opacity, x, y }) => {
  const [loadError, setLoadError] = React.useState(false);

  if (iconPath === null || loadError) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        filter: `blur(${blur}px)`,
        opacity,
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Counter-rotate to stay upright while parent container rotates */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: ROTATION_DURATION,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="w-full h-full"
      >
        <img
          src={iconPath}
          alt=""
          className="w-full h-full object-contain dark:brightness-0 dark:invert"
          onError={() => setLoadError(true)}
        />
      </motion.div>
    </div>
  );
};

// Empty tick for radar chart
const EmptyTick = () => <g />;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ArtistTypeAmbientBackground: React.FC<ArtistTypeAmbientBackgroundProps> = ({
  data,
  blurAmount = 14,
  chartBlur = 20,
  opacity = 0.4,
  chartOpacity = 0.6,
  randomization = 0.5,
  showIcons = true,
  iconBlur = 4,
  iconOpacity = 0.6,
  fadeEdges = true,
  className,
}) => {
  // Track if we're on mobile
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use smaller size on mobile
  const baseSize = isMobile ? BASE_SIZE_MOBILE : BASE_SIZE_DESKTOP;

  // Normalize the input data (just to get the artist type structure)
  const normalizedData = useNormalizedArtistData(data, {
    ensureComplete: true,
    normalizeFrom: 'auto',
  });

  // Generate ambient data - uses real percentages but shuffles colors
  // Graph shape is accurate, but artist type colors are swapped around
  const ambientData = React.useMemo(() => {
    if (!normalizedData || normalizedData.length === 0) return [];
    return prepareAmbientData(normalizedData);
  }, [normalizedData]);

  // Calculate blended color from ambient data
  const blendedColor = React.useMemo(() => {
    if (ambientData.length === 0) return '#6366f1';
    return calculateBlendedColor(ambientData);
  }, [ambientData]);

  // Calculate icon positions based on the base size
  const iconPositions = React.useMemo(() => {
    if (ambientData.length === 0) return [];
    const count = ambientData.length;
    const baseRadius = (baseSize / 2) * ICON_RADIUS_MULTIPLIER;

    return ambientData.map((item, index) => {
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * baseRadius;
      const y = Math.sin(angle) * baseRadius;

      return {
        databaseId: item.databaseId,
        x,
        y,
      };
    });
  }, [ambientData, baseSize]);

  // Icon size proportional to the visualization
  const iconSize = baseSize * 0.12;

  // Don't render if we have no data
  if (ambientData.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 overflow-hidden pointer-events-none',
        'flex items-center justify-center',
        className,
      )}
      style={{ zIndex: -1 }}
    >
      {/* Background ripple effect - rendered via portal to cover entire viewport */}
      {/* vignetteFadeCenter fades out the center so user focuses on the chart */}
      <BackgroundRippleEffect
        cellSize={80}
        ambient
        ambientInterval={4000}
        portal
        vignettePosition="center"
        vignetteFadeCenter
        className="opacity-30"
      />

      {/* Edge fade overlay */}
      {fadeEdges && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse 90% 90% at 55% 50%,
              transparent 0%,
              transparent 25%,
              hsl(var(--background) / 0.4) 50%,
              hsl(var(--background) / 0.8) 70%,
              hsl(var(--background)) 90%
            )`,
            zIndex: 10,
          }}
        />
      )}

      {/* Main ambient container - offset on mobile, offset right on desktop */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
          x: isMobile ? 80 : 150,
          y: isMobile ? 100 : 0,
        }}
        animate={{
          opacity: isMobile ? 0.4 : 1,
          scale: 1,
          x: isMobile ? 80 : 150,
          y: isMobile ? 100 : 0,
        }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="relative"
        style={{
          width: baseSize,
          height: baseSize,
          filter:
            blurAmount > 0
              ? `blur(${isMobile ? Math.min(blurAmount, 4) : blurAmount}px)`
              : undefined,
        }}
      >
        {/* Slow rotating container for the radar */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: ROTATION_DURATION,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ opacity }}
        >
          <div
            style={{
              filter:
                chartBlur > 0
                  ? `blur(${isMobile ? Math.min(chartBlur, 10) : chartBlur}px)`
                  : undefined,
            }}
            className="h-full w-full"
          >
            <Chart
              config={
                {
                  percentage: {
                    label: 'Percentage',
                    color: blendedColor,
                  },
                } satisfies ChartConfig
              }
              className="h-full w-full"
            >
              <RadarChart
                data={ambientData}
                margin={{
                  top: CHART_MARGIN,
                  right: CHART_MARGIN,
                  bottom: CHART_MARGIN,
                  left: CHART_MARGIN,
                }}
                innerRadius={80}
              >
                <PolarAngleAxis dataKey="artistType" tick={EmptyTick} />
                <PolarGrid stroke={blendedColor} strokeOpacity={0.2} />
                {/* Base layer: opaque background color to block ripple effect */}
                <Radar
                  dataKey="percentage"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
                {/* Top layer: the actual colored fill */}
                <Radar
                  dataKey="percentage"
                  fill={blendedColor}
                  fillOpacity={chartOpacity}
                  stroke={blendedColor}
                  strokeWidth={4}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </RadarChart>
            </Chart>
          </div>

          {/* Icons - inside rotating container, each icon counter-rotates to stay upright */}
          {showIcons && (
            <div className="absolute inset-0">
              {iconPositions.map((pos) => {
                const iconPath = getArtistIconPath(pos.databaseId);
                return (
                  <AmbientIcon
                    key={pos.databaseId}
                    iconPath={iconPath}
                    size={iconSize}
                    blur={isMobile ? Math.min(iconBlur, 2) : iconBlur}
                    opacity={iconOpacity}
                    x={pos.x}
                    y={pos.y}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

ArtistTypeAmbientBackground.displayName = 'ArtistTypeAmbientBackground';
