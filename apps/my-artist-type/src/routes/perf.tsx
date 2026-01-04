/**
 * Minimal performance test page - no atoms, no data fetching
 * Used to establish baseline SSR/hydration timing
 */
import { createFileRoute } from '@tanstack/react-router';
import { useHydrationTiming } from '@core/client';

export const Route = createFileRoute('/perf')({
  component: PerfPage,
});

function PerfPage() {
  useHydrationTiming('PerfPage');

  return (
    <div className="container mx-auto p-8 pt-28">
      <h1 className="text-2xl font-bold mb-4">Minimal Performance Test</h1>
      <p className="text-muted-foreground mb-4">
        This page has no data fetching, no atoms - just static content.
      </p>
      <div className="p-4 border rounded-lg">
        <p>If SSR time is still high here, the issue is in:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Vite dev server overhead</li>
          <li>Theme script size in __root.tsx</li>
          <li>Network latency</li>
          <li>Large CSS/JS bundles</li>
        </ul>
      </div>
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="font-mono text-sm">
          Check browser DevTools → Network tab to see actual response times
        </p>
      </div>
    </div>
  );
}
