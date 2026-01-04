/**
 * useHydrationTiming - Hook to measure SSR to hydration timing
 *
 * This hook measures:
 * 1. Time from navigation start to first render (SSR delivery time)
 * 2. Time from first render to hydration complete
 * 3. Total time from navigation to interactive
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useHydrationTiming('MyPage');
 *   return <div>...</div>;
 * }
 * ```
 */

import { useEffect, useRef, useState } from 'react';

export interface HydrationMetrics {
  /** Time from navigation start to this component's first render */
  ssrDeliveryMs: number;
  /** Time from first render to useEffect (hydration complete) */
  hydrationMs: number;
  /** Total time from navigation to interactive */
  totalMs: number;
  /** Navigation start timestamp */
  navigationStart: number;
  /** First render timestamp */
  firstRender: number;
  /** Hydration complete timestamp */
  hydrationComplete: number;
}

// Global storage for SSR timestamp injection
declare global {
  interface Window {
    __SSR_TIMESTAMP__?: number;
    __HYDRATION_METRICS__?: Record<string, HydrationMetrics>;
    __HYDRATION_START__?: number;
  }
}

/**
 * Hook to measure and log hydration timing for a component/page
 *
 * @param label - Label for this measurement (e.g., page name)
 * @param options - Configuration options
 */
export function useHydrationTiming(
  label: string,
  options: {
    /** Whether to log to console (default: true) */
    log?: boolean;
    /** Callback when metrics are available */
    onMetrics?: (metrics: HydrationMetrics) => void;
  } = {},
) {
  // Default to always logging for now
  const { log = true, onMetrics } = options;

  // Capture first render time synchronously during component initialization
  const firstRenderRef = useRef<number>(typeof window !== 'undefined' ? performance.now() : 0);
  const navigationStartRef = useRef<number>(0);
  const hasLoggedRef = useRef(false);

  // Get navigation timing on first render (client-side only)
  if (typeof window !== 'undefined' && navigationStartRef.current === 0) {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        navigationStartRef.current = navEntry.startTime;
      }
    } catch {
      // Fallback if performance API not available
      navigationStartRef.current = 0;
    }
  }

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    // Only log once
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    // This runs after hydration is complete
    const hydrationComplete = performance.now();
    const firstRender = firstRenderRef.current;

    // Calculate metrics
    const metrics: HydrationMetrics = {
      ssrDeliveryMs: Math.round(firstRender - navigationStartRef.current),
      hydrationMs: Math.round(hydrationComplete - firstRender),
      totalMs: Math.round(hydrationComplete - navigationStartRef.current),
      navigationStart: navigationStartRef.current,
      firstRender,
      hydrationComplete,
    };

    // Store globally for debugging
    window.__HYDRATION_METRICS__ = window.__HYDRATION_METRICS__ || {};
    window.__HYDRATION_METRICS__[label] = metrics;

    if (log) {
      // Use a styled console log for visibility
      console.log(
        `%c[Hydration] ${label}%c SSR=%c${metrics.ssrDeliveryMs}ms%c Hydration=%c${metrics.hydrationMs}ms%c Total=%c${metrics.totalMs}ms`,
        'color: #8b5cf6; font-weight: bold',
        'color: inherit',
        'color: #22c55e; font-weight: bold',
        'color: inherit',
        'color: #3b82f6; font-weight: bold',
        'color: inherit',
        'color: #f59e0b; font-weight: bold',
      );
    }

    onMetrics?.(metrics);
  }, [label, log, onMetrics]);
}

/**
 * Get all recorded hydration metrics
 */
export function getHydrationMetrics(): Record<string, HydrationMetrics> {
  if (typeof window === 'undefined') return {};
  return window.__HYDRATION_METRICS__ || {};
}

/**
 * Hook to get hydration metrics with re-render on update
 */
export function useHydrationMetrics(): Record<string, HydrationMetrics> {
  const [metrics, setMetrics] = useState<Record<string, HydrationMetrics>>({});

  useEffect(() => {
    // Poll for updates (metrics are added asynchronously)
    const interval = setInterval(() => {
      const current = window.__HYDRATION_METRICS__ || {};
      setMetrics((prev) => {
        if (Object.keys(current).length !== Object.keys(prev).length) {
          return { ...current };
        }
        return prev;
      });
    }, 100);

    // Initial set
    setMetrics(window.__HYDRATION_METRICS__ || {});

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * Component that displays hydration metrics as an overlay
 */
export function HydrationDebugPanel({ show = true }: { show?: boolean }) {
  const metrics = useHydrationMetrics();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!show || !isClient || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        background: 'rgba(0,0,0,0.85)',
        color: '#22c55e',
        padding: '10px 14px',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        zIndex: 9999,
        maxWidth: 350,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#8b5cf6' }}>Hydration Metrics</div>
      {Object.entries(metrics).map(([label, m]) => (
        <div
          key={label}
          style={{
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ color: '#a1a1aa' }}>{label}</span>
          <span>
            <span style={{ color: '#22c55e' }}>{m.ssrDeliveryMs}</span>
            <span style={{ color: '#666' }}>+</span>
            <span style={{ color: '#3b82f6' }}>{m.hydrationMs}</span>
            <span style={{ color: '#666' }}>=</span>
            <span style={{ color: '#f59e0b' }}>{m.totalMs}ms</span>
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 10,
          color: '#666',
        }}
      >
        SSR + Hydration = Total
      </div>
    </div>
  );
}
