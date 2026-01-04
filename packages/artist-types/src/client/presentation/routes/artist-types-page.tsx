/**
 * ArtistTypesPage - Complete route component with SSR support
 *
 * This module provides everything needed for a TanStack Start route:
 * - Page component with hydration boundary
 * - Grid of all 10 artist types using SimpleBlogWithGrid
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/artist-types/index.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { ArtistTypesPage, loadArtistTypes } from '@artist-types';
 *
 * export const Route = createFileRoute('/artist-types/')({
 *   loader: () => loadArtistTypes(),
 *   component: ArtistTypesPageWrapper,
 * });
 *
 * function ArtistTypesPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <ArtistTypesPage loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';

import { ArtistTypesGridView } from '../views/index.js';

// ============================================================================
// Types
// ============================================================================

export interface ArtistTypesPageProps {
  /**
   * Loader data from TanStack Router (dehydrated artist types atom).
   */
  loaderData: Hydration.DehydratedAtom;
}

// ============================================================================
// Page Component with Hydration
// ============================================================================

/**
 * ArtistTypesPage - Route component with built-in hydration support.
 *
 * Use this component directly in your TanStack Start route.
 * It handles hydration of the artist types atom automatically.
 */
export function ArtistTypesPage({ loaderData }: ArtistTypesPageProps) {
  return (
    <HydrationBoundary state={[loaderData]}>
      <main>
        <ArtistTypesGridView />
      </main>
    </HydrationBoundary>
  );
}

ArtistTypesPage.displayName = 'ArtistTypesPage';
