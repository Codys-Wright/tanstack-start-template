/**
 * Server function for loading a single feature by ID.
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

import { AuthService } from '@auth/server';
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { ExampleServerRuntime } from '../../../../../core/server/runtime.js';
import type { Feature } from '../../../domain/index.js';
import { FeatureService } from '../../../server/index.js';

// ============================================================================
// Types
// ============================================================================

export interface FeatureDetailLoaderData {
  feature: Feature | null;
  error: string | null;
}

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load a single feature by ID for SSR.
 *
 * Returns the feature data or an error message.
 */
export const loadFeatureById = createServerFn({ method: 'GET' })
  .validator((featureId: string) => featureId)
  .handler(async ({ data: featureId }): Promise<FeatureDetailLoaderData> => {
    const exit = await ExampleServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const service = yield* FeatureService;

        // Check authentication (optional - just for logging)
        yield* auth.currentUserId().pipe(
          Effect.tap((userId) => Effect.logInfo(`[loadFeatureById] Authenticated user: ${userId}`)),
          Effect.catchTag('Unauthenticated', () =>
            Effect.logInfo('[loadFeatureById] No session - loading feature as guest'),
          ),
        );

        // Load feature by ID
        return yield* service.getById(featureId as any);
      }),
    );

    if (Exit.isSuccess(exit)) {
      return { feature: exit.value, error: null };
    }

    // Handle error case
    const cause = exit.cause;
    const errorMessage =
      cause._tag === 'Fail' && cause.error._tag === 'FeatureNotFound'
        ? `Feature not found: ${featureId}`
        : 'An error occurred while loading the feature';

    return { feature: null, error: errorMessage };
  });
