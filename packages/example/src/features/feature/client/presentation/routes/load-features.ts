/**
 * Server function for loading features.
 *
 * This module provides the loadFeatures server function that:
 * 1. Authenticates the user (optional - returns empty if not authenticated)
 * 2. Loads all features from the database
 * 3. Returns dehydrated atom for SSR hydration
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/example/index.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { FeaturesPage, loadFeatures } from '@example';
 *
 * export const Route = createFileRoute('/example/')({
 *   loader: () => loadFeatures(),
 *   component: FeaturesPageWrapper,
 * });
 *
 * function FeaturesPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <FeaturesPage loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from "@effect-atom/atom/Hydration";
import { Atom, Result } from "@effect-atom/atom-react";
import { createServerFn } from "@tanstack/react-start";
import * as Effect from "effect/Effect";

import { AuthService } from "@auth/server";

import { ExampleServerRuntime } from "../../../../../core/server/runtime.js";
import { FeatureService } from "../../../server/index.js";
import { featuresAtom } from "../../atoms.js";

// ============================================================================
// Dehydrate Helper
// ============================================================================

/**
 * Dehydrates a single atom value for SSR hydration.
 */
const dehydrate = <A, I>(
  atom: Atom.Atom<A> & {
    [Atom.SerializableTypeId]: { key: string; encode: (value: A) => I };
  },
  value: A,
): Hydration.DehydratedAtom =>
  ({
    "~@effect-atom/atom/DehydratedAtom": true,
    key: atom[Atom.SerializableTypeId].key,
    value: atom[Atom.SerializableTypeId].encode(value),
    dehydratedAt: Date.now(),
  }) as Hydration.DehydratedAtom;

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load features for SSR.
 *
 * This function:
 * 1. Optionally authenticates (logs info if not authenticated)
 * 2. Loads all features (features are public in this example)
 * 3. Returns dehydrated atom for HydrationBoundary
 */
export const loadFeatures = createServerFn({ method: "GET" }).handler(
  async () => {
    const featuresExit = await ExampleServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const service = yield* FeatureService;

        // Check authentication (optional - just for logging)
        yield* auth.currentUserId().pipe(
          Effect.tap((userId) =>
            Effect.logInfo(`[loadFeatures] Authenticated user: ${userId}`),
          ),
          Effect.catchTag("Unauthenticated", () =>
            Effect.logInfo(
              "[loadFeatures] No session - loading features as guest",
            ),
          ),
        );

        yield* Effect.log("LoadFeatures Server Function");

        // Load features (public - no auth required)
        return yield* service.list();
      }),
    );

    return dehydrate(featuresAtom.remote, Result.fromExit(featuresExit));
  },
);
