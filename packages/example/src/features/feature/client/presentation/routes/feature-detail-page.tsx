/**
 * FeatureDetailPage - Detail view for a single feature
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/example/$featureId.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { FeatureDetailPage, loadFeatureById } from '@example';
 *
 * export const Route = createFileRoute('/example/$featureId')({
 *   loader: ({ params }) => loadFeatureById(params.featureId),
 *   component: FeatureDetailPageWrapper,
 * });
 *
 * function FeatureDetailPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <FeatureDetailPage loaderData={loaderData} />;
 * }
 * ```
 */

import { Card } from '@shadcn';

import type { FeatureDetailLoaderData } from './load-feature-by-id.js';

// ============================================================================
// Types
// ============================================================================

export interface FeatureDetailPageProps {
  loaderData: FeatureDetailLoaderData;
}

// ============================================================================
// Page Component
// ============================================================================

export function FeatureDetailPage({ loaderData }: FeatureDetailPageProps) {
  const { feature, error } = loaderData;

  if (error) {
    return (
      <main className="container mx-auto p-4 md:p-6">
        <Card className="p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </main>
    );
  }

  if (!feature) {
    return (
      <main className="container mx-auto p-4 md:p-6">
        <Card className="p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Feature Not Found</h1>
            <p className="text-muted-foreground">The requested feature could not be found.</p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{feature.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {feature.id}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground">
              {feature.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(feature.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Updated:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(feature.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
