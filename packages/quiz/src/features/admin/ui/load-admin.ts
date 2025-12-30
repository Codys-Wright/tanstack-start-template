/**
 * Server function for loading admin dashboard data.
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { Atom, Result } from '@effect-atom/atom-react';
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';

import { QuizServerRuntime } from '../../../core/server/runtime.js';
import { AnalysisServerService } from '../../analysis/server/index.js';
import { analysesAtom } from '../../analysis/client/atoms.js';
import { responsesAtom } from '../../responses/client/atoms.js';
import { ResponsesServerService } from '../../responses/server/index.js';

// ============================================================================
// Dehydrate Helper
// ============================================================================

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

export interface AdminLoaderData {
  responses: Hydration.DehydratedAtom;
  analyses: Hydration.DehydratedAtom;
}

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load admin dashboard data for SSR.
 */
export const loadAdmin = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminLoaderData> => {
    console.log('[loadAdmin] Starting SSR data fetch...');

    const result = await QuizServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const responsesService = yield* ResponsesServerService;
        const analysisService = yield* AnalysisServerService;

        console.log('[loadAdmin] Services acquired, fetching data...');

        // Load all data in parallel
        const [responses, analyses] = yield* Effect.all([
          responsesService.list(),
          analysisService.list(),
        ]);

        console.log('[loadAdmin] Data fetched:', {
          responsesCount: responses.length,
          analysesCount: analyses.length,
        });

        return { responses, analyses };
      }),
    );

    const data = Result.fromExit(result);

    if (Result.isSuccess(data)) {
      return {
        responses: dehydrate(responsesAtom.remote, Result.success(data.value.responses)),
        analyses: dehydrate(analysesAtom.remote, Result.success(data.value.analyses)),
      };
    }

    // Return error state for all atoms
    const errorResult = Result.failure(data.cause);
    return {
      responses: dehydrate(responsesAtom.remote, errorResult as any),
      analyses: dehydrate(analysesAtom.remote, errorResult as any),
    };
  },
);
