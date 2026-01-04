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

import { useEffect, useRef } from "react";

interface HydrationMetrics {
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
    /** Whether to log to console (default: true in dev) */
    log?: boolean;
    /** Callback when metrics are available */
    onMetrics?: (metrics: HydrationMetrics) => void;
  } = {}
) {
  const { log = process.env.NODE_ENV === "development", onMetrics } = options;

  // Capture first render time synchronously
  const firstRenderRef = useRef<number>(performance.now());
  const navigationStartRef = useRef<number>(0);

  // Get navigation timing
  if (typeof window !== "undefined" && navigationStartRef.current === 0) {
    const navEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    navigationStartRef.current = navEntry?.startTime ?? 0;
  }

  useEffect(() => {
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
    if (typeof window !== "undefined") {
      window.__HYDRATION_METRICS__ = window.__HYDRATION_METRICS__ || {};
      window.__HYDRATION_METRICS__[label] = metrics;
    }

    if (log) {
      console.log(
        `[Hydration] ${label}: SSR=${metrics.ssrDeliveryMs}ms, Hydration=${metrics.hydrationMs}ms, Total=${metrics.totalMs}ms`
      );
    }

    onMetrics?.(metrics);
  }, []); // Only run once on mount
}

/**
 * Get all recorded hydration metrics
 */
export function getHydrationMetrics(): Record<string, HydrationMetrics> {
  if (typeof window === "undefined") return {};
  return window.__HYDRATION_METRICS__ || {};
}

/**
 * Component that displays hydration metrics in dev mode
 */
export function HydrationDebugPanel() {
  const metrics =
    typeof window !== "undefined" ? window.__HYDRATION_METRICS__ : {};

  if (process.env.NODE_ENV !== "development" || !metrics) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        background: "rgba(0,0,0,0.8)",
        color: "#0f0",
        padding: "8px 12px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
        Hydration Metrics
      </div>
      {Object.entries(metrics).map(([label, m]) => (
        <div key={label} style={{ marginBottom: 2 }}>
          <span style={{ color: "#888" }}>{label}:</span> SSR={m.ssrDeliveryMs}
          ms, Hydrate=
          {m.hydrationMs}ms
        </div>
      ))}
    </div>
  );
}
