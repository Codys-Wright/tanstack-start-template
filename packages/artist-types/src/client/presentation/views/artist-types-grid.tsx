/**
 * ArtistTypesGridView - Grid view component for displaying all artist types
 *
 * This component:
 * 1. Reads from the artistTypesAtom
 * 2. Displays a grid of artist type cards using SimpleBlogWithGrid
 * 3. Handles loading and error states
 */

import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { SimpleBlogWithGrid, type BlogGridItem } from '@components';
import { Alert, Button, Skeleton } from '@shadcn';
import { artistTypesAtom } from '../../atoms.js';
import type { ArtistType } from '../../../domain/schema.js';

// ============================================================================
// Helper: Transform ArtistType to BlogGridItem
// ============================================================================

function artistTypeToBlogItem(artistType: ArtistType): BlogGridItem {
  return {
    title: artistType.name,
    description: artistType.elevatorPitch,
    slug: artistType.id,
    image: artistType.icon,
  };
}

// ============================================================================
// Loading State Component
// ============================================================================

function ArtistTypesGridLoading() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10">
          <Skeleton className="mb-4 h-10 w-48" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border dark:border-neutral-800">
              <Skeleton className="h-52 w-full" />
              <div className="p-4 md:p-8">
                <Skeleton className="mb-4 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Grid View Component
// ============================================================================

export function ArtistTypesGridView() {
  const result = useAtomValue(artistTypesAtom);
  const refresh = useAtomRefresh(artistTypesAtom);

  return Result.builder(result)
    .onInitial(() => <ArtistTypesGridLoading />)
    .onSuccess((artistTypes) => {
      const items = artistTypes.map(artistTypeToBlogItem);

      return (
        <SimpleBlogWithGrid
          title="Artist Types"
          description="Discover the 10 artist types and find yours. Each type represents a unique approach to creativity and artistic expression."
          items={items}
          basePath="/artist-types"
          columns={3}
          withNavbarSpacing
        />
      );
    })
    .onFailure((error) => (
      <div className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Alert variant="destructive">
            <Alert.Title>Failed to load artist types</Alert.Title>
            <Alert.Description>
              <div className="mb-2 text-sm">Error: {String(error)}</div>
              <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
                Retry
              </Button>
            </Alert.Description>
          </Alert>
        </div>
      </div>
    ))
    .render();
}

ArtistTypesGridView.displayName = 'ArtistTypesGridView';
