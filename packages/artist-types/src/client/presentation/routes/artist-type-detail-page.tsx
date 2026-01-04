/**
 * ArtistTypeDetailPage - Blog-style detail page for an artist type
 *
 * This page displays the full content for a single artist type including:
 * - Hero image (icon)
 * - Title and subtitle
 * - Long description (markdown)
 * - Metadata sections (strengths, challenges, collaborators, etc.)
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/artist-types/$slug.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { ArtistTypeDetailPage, loadArtistType } from '@artist-types';
 *
 * export const Route = createFileRoute('/artist-types/$slug')({
 *   loader: ({ params }) => loadArtistType({ data: params.slug }),
 *   component: ArtistTypeDetailPageWrapper,
 * });
 *
 * function ArtistTypeDetailPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <ArtistTypeDetailPage loaderData={loaderData} />;
 * }
 * ```
 */

import { BlogContentWithToc } from '@components';
import { Alert, Card } from '@shadcn';
import type { ArtistTypeDetailLoaderData } from './load-artist-type.js';

// ============================================================================
// Types
// ============================================================================

export interface ArtistTypeDetailPageProps {
  loaderData: ArtistTypeDetailLoaderData;
}

// ============================================================================
// Metadata Cards Component
// ============================================================================

interface MetadataCardsProps {
  metadata: {
    strengths: string[];
    challenges: string[];
    idealCollaborators?: string[];
    recommendedPractices?: string[];
    careerPaths?: string[];
  };
}

function MetadataCards({ metadata }: MetadataCardsProps) {
  return (
    <div className="mt-12 space-y-8">
      {/* Divider */}
      <div className="max-w-2xl">
        <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">At a Glance</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <Card>
          <Card.Header>
            <Card.Title className="text-green-600 dark:text-green-400">Strengths</Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="space-y-2">
              {metadata.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  {strength}
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        {/* Challenges */}
        <Card>
          <Card.Header>
            <Card.Title className="text-amber-600 dark:text-amber-400">Challenges</Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="space-y-2">
              {metadata.challenges.map((challenge, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {challenge}
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        {/* Ideal Collaborators */}
        {metadata.idealCollaborators && metadata.idealCollaborators.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title className="text-blue-600 dark:text-blue-400">
                Ideal Collaborators
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <ul className="space-y-2">
                {metadata.idealCollaborators.map((collaborator, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    {collaborator}
                  </li>
                ))}
              </ul>
            </Card.Content>
          </Card>
        )}

        {/* Career Paths */}
        {metadata.careerPaths && metadata.careerPaths.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title className="text-purple-600 dark:text-purple-400">Career Paths</Card.Title>
            </Card.Header>
            <Card.Content>
              <ul className="space-y-2">
                {metadata.careerPaths.map((path, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                    {path}
                  </li>
                ))}
              </ul>
            </Card.Content>
          </Card>
        )}
      </div>

      {/* Recommended Practices - Full width */}
      {metadata.recommendedPractices && metadata.recommendedPractices.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="text-indigo-600 dark:text-indigo-400">
              Recommended Practices
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-3 md:grid-cols-2">
              {metadata.recommendedPractices.map((practice, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  {practice}
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export function ArtistTypeDetailPage({ loaderData }: ArtistTypeDetailPageProps) {
  const { artistType, error } = loaderData;

  // Error state
  if (error || !artistType) {
    return (
      <main className="container mx-auto p-4 md:p-6">
        <Alert variant="destructive">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error ?? 'Artist type not found'}</Alert.Description>
        </Alert>
      </main>
    );
  }

  // Parse metadata - it comes as a JSON string from the encoded schema
  const metadata =
    typeof artistType.metadata === 'string' ? JSON.parse(artistType.metadata) : artistType.metadata;

  return (
    <main className="container mx-auto py-8">
      <BlogContentWithToc
        title={artistType.name}
        subtitle={artistType.subtitle}
        content={artistType.longDescription}
        thumbnail={artistType.icon}
        author="Ethos Creative"
        authorImage="/logo.svg"
        date={artistType.createdAt}
      >
        {/* Elevator Pitch */}
        <blockquote className="mt-8 border-l-4 border-primary pl-4 italic text-neutral-600 dark:text-neutral-400">
          {artistType.elevatorPitch}
        </blockquote>

        {/* Metadata Cards */}
        <MetadataCards metadata={metadata} />
      </BlogContentWithToc>
    </main>
  );
}

ArtistTypeDetailPage.displayName = 'ArtistTypeDetailPage';
