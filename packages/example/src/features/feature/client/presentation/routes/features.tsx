import { cn } from '@shadcn';
import { FeaturesListView } from '../views/index.js';

export interface FeaturesRouteProps {
  className?: string;
}

/**
 * FeaturesRoute - Route component for displaying features.
 *
 * This component is meant to be used in app route files:
 *
 * @example
 * ```tsx
 * // apps/my-app/src/routes/features/index.tsx
 * import { createFileRoute } from "@tanstack/react-router";
 * import { FeaturesRoute } from "@example";
 *
 * export const Route = createFileRoute("/features/")({
 *   component: RouteComponent,
 * });
 *
 * function RouteComponent() {
 *   return (
 *     <main className="container mx-auto p-4">
 *       <FeaturesRoute />
 *     </main>
 *   );
 * }
 * ```
 */
export function FeaturesRoute({ className }: FeaturesRouteProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h1 className="text-2xl font-bold">Features</h1>
        <p className="text-muted-foreground">Manage your features here.</p>
      </div>
      <FeaturesListView />
    </div>
  );
}
