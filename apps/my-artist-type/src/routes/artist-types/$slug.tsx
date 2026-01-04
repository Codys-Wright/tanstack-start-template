import { createFileRoute } from '@tanstack/react-router';
import { ArtistTypeDetailPage, loadArtistType } from '@artist-types';

/**
 * Artist Type Detail route - displays a single artist type's full content
 * Blog-style page with markdown content and metadata cards
 */
export const Route = createFileRoute('/artist-types/$slug')({
  loader: ({ params }) => loadArtistType({ data: params.slug }),
  component: ArtistTypeDetailPageWrapper,
});

function ArtistTypeDetailPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <ArtistTypeDetailPage loaderData={loaderData} />;
}
