'use client';
import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@shadcn';

// =============================================================================
// TYPES
// =============================================================================

export interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
  /** If true, disables click interaction and auto-triggers ambient ripples */
  ambient?: boolean;
  /** Interval in ms between ambient ripples (default: 3000) */
  ambientInterval?: number;
  /** If true, renders using a portal to escape layout boundaries and cover the entire viewport */
  portal?: boolean;
  /** Position of the radial vignette focus: 'top' | 'center' | 'bottom' (default: 'center') */
  vignettePosition?: 'top' | 'center' | 'bottom';
  /** If true, fades out the center and keeps edges visible (default: false) */
  vignetteFadeCenter?: boolean;
  /** Opacity of the grid (0-100, default: 60) */
  opacity?: number;
}

interface DivGridProps {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
}

type CellStyle = React.CSSProperties & {
  '--delay'?: string;
  '--duration'?: string;
};

// =============================================================================
// COMPONENTS
// =============================================================================

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = '#3f3f46',
  fillColor = 'rgba(14,165,233,0.3)',
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(() => Array.from({ length: rows * cols }, (_, idx) => idx), [rows, cols]);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: 'auto',
  };

  return (
    <div className={cn('relative z-[3]', className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0;
        const duration = 200 + distance * 80;

        const style: CellStyle = clickedCell
          ? {
              '--delay': `${delay}ms`,
              '--duration': `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              'cell relative border-[0.5px] opacity-40 transition-opacity duration-150 will-change-transform hover:opacity-80 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]',
              clickedCell && 'animate-cell-ripple [animation-fill-mode:none]',
              !interactive && 'pointer-events-none',
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const VIGNETTE_POSITION_MAP = {
  top: '50% 0%',
  center: '50% 50%',
  bottom: '50% 100%',
} as const;

export const BackgroundRippleEffect = ({
  rows: rowsProp,
  cols: colsProp,
  cellSize = 56,
  className,
  ambient = false,
  ambientInterval = 3000,
  portal = false,
  vignettePosition = 'center',
  vignetteFadeCenter = false,
  opacity = 60,
}: BackgroundRippleEffectProps) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [containerSize, setContainerSize] = useState({
    width: 1920,
    height: 1080,
  });
  const ref = useRef<HTMLDivElement>(null);

  // Track mount state and get container/viewport size
  React.useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      if (portal) {
        setContainerSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } else if (ref.current?.parentElement) {
        // Use parent container size for non-portal mode
        setContainerSize({
          width: ref.current.parentElement.offsetWidth,
          height: ref.current.parentElement.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [portal]);

  // Calculate rows/cols to cover container
  const rows = rowsProp ?? Math.ceil(containerSize.height / cellSize) + 2;
  const cols = colsProp ?? Math.ceil(containerSize.width / cellSize) + 2;

  // Ambient mode: auto-trigger ripples at random positions
  React.useEffect(() => {
    if (!ambient) return;

    const triggerAmbientRipple = () => {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      setClickedCell({ row: randomRow, col: randomCol });
      setRippleKey((k) => k + 1);
    };

    // Trigger initial ripple
    triggerAmbientRipple();

    const interval = setInterval(triggerAmbientRipple, ambientInterval);
    return () => clearInterval(interval);
  }, [ambient, ambientInterval, rows, cols]);

  const content = (
    <div
      ref={ref}
      className={cn(
        portal ? 'fixed inset-0 h-screen w-screen' : 'absolute inset-0 h-full w-full',
        '[--cell-border-color:var(--color-neutral-300)] [--cell-fill-color:var(--color-neutral-100)] [--cell-shadow-color:var(--color-neutral-500)]',
        'dark:[--cell-border-color:var(--color-neutral-700)] dark:[--cell-fill-color:var(--color-neutral-900)] dark:[--cell-shadow-color:var(--color-neutral-800)]',
        'pointer-events-none overflow-hidden',
        className,
      )}
      style={portal ? { zIndex: -10 } : undefined}
    >
      {/* Position grid at top-left to cover entire container */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0" style={{ opacity: opacity / 100 }}>
          <DivGrid
            key={`base-${rippleKey}`}
            rows={rows}
            cols={cols}
            cellSize={cellSize}
            borderColor="var(--cell-border-color)"
            fillColor="var(--cell-fill-color)"
            clickedCell={clickedCell}
            onCellClick={(row, col) => {
              setClickedCell({ row, col });
              setRippleKey((k) => k + 1);
            }}
            interactive={!ambient}
          />
        </div>
        {/* Vignette overlay - uses background color to fade areas */}
        {vignetteFadeCenter && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 50% at ${VIGNETTE_POSITION_MAP[vignettePosition]}, hsl(var(--background)) 0%, hsl(var(--background) / 0.9) 20%, hsl(var(--background) / 0.5) 40%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );

  // Use portal to render at body level if requested
  if (portal && mounted && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

BackgroundRippleEffect.displayName = 'BackgroundRippleEffect';
