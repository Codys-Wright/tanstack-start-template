/**
 * Server function for loading my-response page data.
 *
 * This module provides the loadMyResponse server function that:
 * 1. Loads the response by ID
 * 2. Loads the analysis results for that response
 * 3. Returns dehydrated atoms for SSR hydration
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/my-response.$responseId.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { MyResponsePage, loadMyResponse } from '@quiz';
 *
 * export const Route = createFileRoute('/my-response/$responseId')({
 *   loader: ({ params }) => loadMyResponse({ data: { responseId: params.responseId } }),
 *   component: MyResponsePageWrapper,
 * });
 *
 * function MyResponsePageWrapper() {
 *   const { responseId } = Route.useParams();
 *   const loaderData = Route.useLoaderData();
 *   return <MyResponsePage responseId={responseId} loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { Atom, Result } from '@effect-atom/atom-react';
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';

import { QuizServerRuntime } from '../../../core/server/runtime.js';
import { ResponsesServerService } from '../../responses/server/service.js';
import { AnalysisServerService } from '../../analysis/server/service.js';
import { responsesAtom } from '../../responses/client/atoms.js';
import { analysesAtom } from '../../analysis/client/atoms.js';
import type { ResponseId } from '../../responses/domain/schema.js';

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
    '~@effect-atom/atom/DehydratedAtom': true,
    key: atom[Atom.SerializableTypeId].key,
    value: atom[Atom.SerializableTypeId].encode(value),
    dehydratedAt: Date.now(),
  }) as Hydration.DehydratedAtom;

// ============================================================================
// Types
// ============================================================================

export interface MyResponseLoaderData {
  response: Hydration.DehydratedAtom;
  analyses: Hydration.DehydratedAtom;
}

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load my-response page data for SSR.
 *
 * This function:
 * 1. Loads the specific response by ID
 * 2. Loads analysis results for that response
 * 3. Returns dehydrated atoms for HydrationBoundary
 */
export const loadMyResponse = createServerFn({ method: 'GET' })
  .inputValidator((data: { responseId: string }) => data)
  .handler(async (ctx): Promise<MyResponseLoaderData> => {
    // Extract responseId from the context - it comes from the route params
    const responseId = ctx.data.responseId;
    if (!responseId) {
      throw new Error('Response ID is required');
    }
    console.log('[loadMyResponse] Starting SSR data fetch for response:', responseId);

    const result = await QuizServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const responsesService = yield* ResponsesServerService;
        const analysisService = yield* AnalysisServerService;

        console.log('[loadMyResponse] Services acquired, fetching data...');

        // Load response by ID
        const response = yield* responsesService.getById(responseId as ResponseId);

        // Load analyses for this response
        const analyses = yield* analysisService.getByResponse(responseId as ResponseId);

        console.log('[loadMyResponse] Data fetched:', {
          responseId: response.id,
          analysesCount: analyses.length,
        });

        return { response, analyses };
      }),
    );

    const resultData = Result.fromExit(result);

    if (Result.isSuccess(resultData)) {
      // For the responses atom, we wrap in an array since it expects a list
      // The actual response data will be available, but we're dehydrating the list atom
      return {
        response: dehydrate(
          responsesAtom.remote,
          Result.success([resultData.value.response] as any),
        ),
        analyses: dehydrate(analysesAtom.remote, Result.success(resultData.value.analyses)),
      };
    }

    // Return error state for all atoms
    const errorResult = Result.failure(resultData.cause);
    return {
      response: dehydrate(responsesAtom.remote, errorResult as any),
      analyses: dehydrate(analysesAtom.remote, errorResult as any),
    };
  });
