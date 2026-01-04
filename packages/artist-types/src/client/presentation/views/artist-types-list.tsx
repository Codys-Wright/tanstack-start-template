/**
 * ArtistTypesListView - View component for displaying a list of artist types
 *
 * This component:
 * 1. Reads from the artistTypesAtom
 * 2. Displays a grid of artist type cards
 * 3. Handles loading and error states
 */

import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { Alert, Button } from '@shadcn';
import { artistTypesAtom } from '../../atoms.js';
import { ArtistTypeCard } from '../components/index.js';

export function ArtistTypesListView() {
  const result = useAtomValue(artistTypesAtom);
  const refresh = useAtomRefresh(artistTypesAtom);

  return (
    <div>
      {Result.builder(result)
        .onInitial(() => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ))
        .onSuccess((types) => {
          return types.length === 0 ? (
            <p className="text-muted-foreground">No artist types available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((type) => (
                <ArtistTypeCard key={type.id} artistType={type} />
              ))}
            </div>
          );
        })
        .onFailure((error) => (
          <Alert variant="destructive">
            <Alert.Title>Failed to load artist types</Alert.Title>
            <Alert.Description>
              <div className="mb-2 text-sm">Error: {String(error)}</div>
              <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
                Retry
              </Button>
            </Alert.Description>
          </Alert>
        ))
        .render()}
    </div>
  );
}
