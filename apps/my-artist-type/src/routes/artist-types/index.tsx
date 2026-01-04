import { createFileRoute } from '@tanstack/react-router';
import { ArtistTypesPage, loadArtistTypes } from '@artist-types';

/**
 * Artist Types route - catalog of all artist types and their characteristics
 * Displays a grid of all 10 artist types with links to detail pages
 */
export const Route = createFileRoute('/artist-types/')({
  loader: () => loadArtistTypes(),
  component: ArtistTypesPageWrapper,
});

function ArtistTypesPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <ArtistTypesPage loaderData={loaderData} />;
}
