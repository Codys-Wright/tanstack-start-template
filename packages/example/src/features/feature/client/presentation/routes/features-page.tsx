/**
 * FeaturesPage - Complete route component with SSR support
 *
 * This module provides everything needed for a TanStack Start route:
 * - Page component with hydration boundary
 * - Feature list display
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/example/index.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { FeaturesPage, loadFeatures } from '@example';
 *
 * export const Route = createFileRoute('/example/')({
 *   loader: () => loadFeatures(),
 *   component: FeaturesPageWrapper,
 * });
 *
 * function FeaturesPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <FeaturesPage loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';

import { FeaturesListView } from '../views/index.js';

// ============================================================================
// Types
// ============================================================================

export interface FeaturesPageProps {
  /**
   * Loader data from TanStack Router (dehydrated features atom).
   */
  loaderData: Hydration.DehydratedAtom;
}

// ============================================================================
// Page Content Component
// ============================================================================

function FeaturesPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Features</h1>
        <p className="text-muted-foreground">Example feature page with SSR hydration.</p>
      </div>
      <FeaturesListView />
    </div>
  );
}

// ============================================================================
// Page Component with Hydration
// ============================================================================

/**
 * FeaturesPage - Route component with built-in hydration support.
 *
 * Use this component directly in your TanStack Start route.
 * It handles hydration of the features atom automatically.
 */
export function FeaturesPage({ loaderData }: FeaturesPageProps) {
  return (
    <HydrationBoundary state={[loaderData]}>
      <main className="container mx-auto p-4 md:p-6">
        <FeaturesPageContent />
      </main>
    </HydrationBoundary>
  );
}
