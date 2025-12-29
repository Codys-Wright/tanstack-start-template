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
 *   loader: ({ params }) => loadFeatureById({ data: params.featureId }),
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
import * as Cause from 'effect/Cause';
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
export const loadFeatureById = createServerFn({ method: 'GET' }).handler(
  async (ctx: { data: string }): Promise<FeatureDetailLoaderData> => {
    const featureId = ctx.data;

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

    // Handle error case - check if it's a FeatureNotFound error
    const failureOption = Cause.failureOption(exit.cause);
    if (failureOption._tag === 'Some') {
      const error = failureOption.value as { _tag?: string };
      if (error._tag === 'FeatureNotFound') {
        return { feature: null, error: `Feature not found: ${featureId}` };
      }
    }

    return {
      feature: null,
      error: 'An error occurred while loading the feature',
    };
  },
);
