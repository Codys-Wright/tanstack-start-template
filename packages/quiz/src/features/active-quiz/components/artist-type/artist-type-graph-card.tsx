'use client';

import { Card, cn } from '@shadcn';

// Import our chart components
import { ArtistBarChart } from './artist-bar-chart.js';
import { ArtistRadarChart } from './artist-radar-chart.js';

// Import our artist data utilities
import type { ArtistData } from './artist-data-utils.js';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ArtistTypeGraphCardProps = {
  data?: Array<ArtistData>;
  showBarChart?: boolean;
  barChartHeight?: string;
  barChartMaxItems?: number;
  className?: string;
  contentClassName?: string;
  transparent?: boolean;
  fill?: boolean;
  beta?: number;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ArtistTypeGraphCard = ({
  barChartHeight = 'h-56',
  barChartMaxItems = 10,
  beta,
  className = '',
  contentClassName = '',
  data,
  fill = false,
  showBarChart = true,
  transparent = false,
}: ArtistTypeGraphCardProps) => {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        transparent && 'bg-transparent border-none shadow-none',
        className,
      )}
    >
      <Card.Content
        className={cn(fill ? 'h-full w-full p-0' : 'aspect-square p-4', contentClassName)}
      >
        <ArtistRadarChart
          {...(data !== undefined && { data })}
          {...(beta !== undefined && { beta })}
        />
      </Card.Content>
      {showBarChart && (
        <Card.Footer className="flex-col overflow-hidden p-2">
          <div className="w-full max-w-full overflow-hidden">
            <ArtistBarChart
              {...(data !== undefined && { data })}
              {...(beta !== undefined && { beta })}
              height={barChartHeight}
              maxItems={barChartMaxItems}
              className="text-left w-full max-w-full"
            />
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

ArtistTypeGraphCard.displayName = 'ArtistTypeGraphCard';

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type { ArtistData };
