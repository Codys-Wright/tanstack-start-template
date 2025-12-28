import { ApiClient, makeAtomRuntime, withToast } from '@core/client';
import { Atom, Registry, Result } from '@effect-atom/atom-react';
import type { AnalysisEngineId, AnalysisResultId } from './analysis-engine/schema.js';
import type {
  AnalysisResult,
  AnalysisSummary,
  AnalyzeResponseRequest,
  BatchAnalyzeRequest,
  UpsertAnalysisResultPayload,
} from './schema.js';
import type { ResponseId } from '../responses/schema.js';
import { AnalysisService } from './service.js';
import { Data, Effect, Array as EffectArray, Layer } from 'effect';

const runtime = makeAtomRuntime(Layer.mergeAll(ApiClient.Default, AnalysisService.Default));

// Remote atom for getting analysis results (empty by default to avoid UUID validation errors)
const analysisRemoteAtom = runtime.atom(Effect.succeed([] as ReadonlyArray<AnalysisResult>));

// Remote atom for getting all analysis results
const allAnalysisRemoteAtom = runtime.atom(
  Effect.fn(function* () {
    const api = yield* ApiClient;
    return yield* api.http.Analysis.list();
  }),
);

// Remote atom for getting analysis summary (null by default to avoid UUID validation errors)
const analysisSummaryRemoteAtom = runtime.atom(Effect.succeed(null as AnalysisSummary | null));

type Action = Data.TaggedEnum<{
  Upsert: { readonly analysis: AnalysisResult };
  Del: { readonly id: AnalysisResultId };
  BatchUpsert: { readonly analyses: ReadonlyArray<AnalysisResult> };
}>;
const Action = Data.taggedEnum<Action>();

// Analysis results atom that manages local state
export const analysisAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(analysisRemoteAtom),
    (ctx, action: Action) => {
      const result = ctx.get(analysisAtom);
      if (!Result.isSuccess(result)) return;

      const update = Action.$match(action, {
        Del: ({ id }) => result.value.filter((analysis) => analysis.id !== id),
        Upsert: ({ analysis }) => {
          const existing = result.value.find((a) => a.id === analysis.id);
          if (existing !== undefined)
            return result.value.map((a) => (a.id === analysis.id ? analysis : a));
          return EffectArray.prepend(result.value, analysis);
        },
        BatchUpsert: ({ analyses }) => {
          // For batch upsert, we replace the entire array
          return analyses;
        },
      });

      ctx.setSelf(Result.success(update));
    },
  ),
  {
    remote: analysisRemoteAtom,
  },
);

// All analysis results atom (read-only)
export const allAnalysisAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(allAnalysisRemoteAtom),
    (ctx, action: Action) => {
      const result = ctx.get(allAnalysisAtom);
      if (!Result.isSuccess(result)) return;

      const update = Action.$match(action, {
        Del: ({ id }) => result.value.filter((analysis) => analysis.id !== id),
        Upsert: ({ analysis }) => {
          const existing = result.value.find((a) => a.id === analysis.id);
          if (existing !== undefined)
            return result.value.map((a) => (a.id === analysis.id ? analysis : a));
          return EffectArray.prepend(result.value, analysis);
        },
        BatchUpsert: ({ analyses }) => {
          // For batch upsert, we replace the entire array
          return analyses;
        },
      });

      ctx.setSelf(Result.success(update));
    },
  ),
  {
    remote: allAnalysisRemoteAtom,
  },
);

// Analysis summary atom
export const analysisSummaryAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(analysisSummaryRemoteAtom),
    (ctx, summary: AnalysisSummary | null) => {
      ctx.setSelf(Result.success(summary));
    },
  ),
  {
    remote: analysisSummaryRemoteAtom,
  },
);

export const analyzeResponseAtom = runtime.fn(
  Effect.fn(
    function* (params: { engineId: AnalysisEngineId; request: AnalyzeResponseRequest }) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const analysis = yield* api.http.Analysis.analyze({
        payload: {
          engineId: params.engineId,
          request: params.request,
        },
      });
      registry.set(analysisAtom, Action.Upsert({ analysis }));
      return analysis;
    },
    withToast({
      onWaiting: 'Analyzing response...',
      onSuccess: 'Analysis completed',
      onFailure: 'Failed to analyze response',
    }),
  ),
);

export const batchAnalyzeAtom = runtime.fn(
  Effect.fn(
    function* (params: { engineId: AnalysisEngineId; request: BatchAnalyzeRequest }) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const analyses = yield* api.http.Analysis.batchAnalyze({
        payload: {
          engineId: params.engineId,
          request: params.request,
        },
      });
      registry.set(analysisAtom, Action.BatchUpsert({ analyses }));
      return analyses;
    },
    withToast({
      onWaiting: 'Batch analyzing responses...',
      onSuccess: 'Batch analysis completed',
      onFailure: 'Failed to batch analyze responses',
    }),
  ),
);

export const deleteAnalysisAtom = runtime.fn(
  Effect.fn(
    function* (id: AnalysisResultId) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      yield* api.http.Analysis.deleteAnalysis({ payload: { id } });
      registry.set(analysisAtom, Action.Del({ id }));
    },
    withToast({
      onWaiting: 'Deleting analysis...',
      onSuccess: 'Analysis deleted',
      onFailure: 'Failed to delete analysis',
    }),
  ),
);

export const getAnalysisByResponseAtom = runtime.fn(
  Effect.fn(
    function* (responseId: ResponseId) {
      const api = yield* ApiClient;
      return yield* api.http.Analysis.getAnalysis({ payload: { responseId } });
    },
    withToast({
      onWaiting: 'Loading analysis...',
      onSuccess: 'Analysis loaded',
      onFailure: 'Failed to load analysis',
    }),
  ),
);

export const getAnalysisSummaryAtom = runtime.fn(
  Effect.fn(
    function* (engineId: AnalysisEngineId) {
      const api = yield* ApiClient;
      return yield* api.http.Analysis.getAnalysisSummary({
        payload: { engineId },
      });
    },
    withToast({
      onWaiting: 'Loading analysis summary...',
      onSuccess: 'Analysis summary loaded',
      onFailure: 'Failed to load analysis summary',
    }),
  ),
);

// Service-based function atoms using AnalysisService
export const analyzeResponseWithServiceAtom = runtime.fn(
  Effect.fn(
    function* (params: { engineId: AnalysisEngineId; responseId: ResponseId }) {
      const api = yield* ApiClient;
      const analysisService = yield* AnalysisService;
      const registry = yield* Registry.AtomRegistry;

      // Get the engine, quiz, and response data
      const [engine, response] = yield* Effect.all([
        api.http.AnalysisEngine.byId({ payload: { id: params.engineId } }),
        api.http.Responses.byId({ payload: { id: params.responseId } }),
      ]);

      // Log the full response object
      console.log('🔍 Full response object:', response);

      // Get the quiz for this response
      const quiz = yield* api.http.Quizzes.byId({
        payload: { id: response.quizId },
      });

      // Use the AnalysisService to perform the analysis
      const analysisResult = yield* analysisService.analyzeWithValidation(engine, quiz, response);

      // Save the analysis result to the database
      const savedAnalysisResult = yield* api.http.Analysis.upsert({
        payload: {
          engineId: analysisResult.engineId,
          engineVersion: analysisResult.engineVersion,
          responseId: analysisResult.responseId,
          endingResults: analysisResult.endingResults,
          metadata: analysisResult.metadata,
          analyzedAt: analysisResult.analyzedAt,
        },
      });

      // Update the local atom state
      registry.set(allAnalysisAtom, Action.Upsert({ analysis: savedAnalysisResult }));

      return savedAnalysisResult;
    },
    withToast({
      onWaiting: 'Analyzing response...',
      onSuccess: 'Analysis completed and saved',
      onFailure: 'Analysis failed',
    }),
  ),
);

export const getAnalysisSummaryWithServiceAtom = runtime.fn(
  Effect.fn(
    function* (params: { engineId: AnalysisEngineId }) {
      const api = yield* ApiClient;

      // Use the existing API endpoint that returns the summary directly
      return yield* api.http.Analysis.getAnalysisSummary({
        payload: { engineId: params.engineId },
      });
    },
    withToast({
      onWaiting: 'Generating analysis summary...',
      onSuccess: 'Analysis summary generated',
      onFailure: 'Failed to generate analysis summary',
    }),
  ),
);

// CRUD operations for analysis results
export const upsertAnalysisResultAtom = runtime.fn(
  Effect.fn(
    function* (payload: UpsertAnalysisResultPayload) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const analysisResult = yield* api.http.Analysis.upsert({ payload });
      registry.set(allAnalysisAtom, Action.Upsert({ analysis: analysisResult }));
    },
    withToast({
      onWaiting: (payload) =>
        `${payload.id !== undefined ? 'Updating' : 'Creating'} analysis result...`,
      onSuccess: 'Analysis result saved',
      onFailure: 'Failed to save analysis result',
    }),
  ),
);

export const deleteAnalysisResultAtom = runtime.fn(
  Effect.fn(
    function* (id: AnalysisResultId) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      yield* api.http.Analysis.deleteAnalysis({ payload: { id } });
      registry.set(allAnalysisAtom, Action.Del({ id }));
    },
    withToast({
      onWaiting: 'Deleting analysis result...',
      onSuccess: 'Analysis result deleted',
      onFailure: 'Failed to delete analysis result',
    }),
  ),
);

export const getAnalysisResultByIdAtom = runtime.fn(
  Effect.fn(
    function* (id: AnalysisResultId) {
      const api = yield* ApiClient;
      return yield* api.http.Analysis.getById({ payload: { id } });
    },
    withToast({
      onWaiting: 'Loading analysis result...',
      onSuccess: 'Analysis result loaded',
      onFailure: 'Failed to load analysis result',
    }),
  ),
);

export const getAnalysisResultsByResponseAtom = runtime.fn(
  Effect.fn(
    function* (responseId: ResponseId) {
      const api = yield* ApiClient;
      return yield* api.http.Analysis.getAnalysis({ payload: { responseId } });
    },
    withToast({
      onWaiting: 'Loading analysis results...',
      onSuccess: 'Analysis results loaded',
      onFailure: 'Failed to load analysis results',
    }),
  ),
);

export const getAnalysisResultsByEngineAtom = runtime.fn(
  Effect.fn(
    function* (engineId: AnalysisEngineId) {
      const api = yield* ApiClient;
      return yield* api.http.Analysis.getByEngine({ payload: { engineId } });
    },
    withToast({
      onWaiting: 'Loading analysis results...',
      onSuccess: 'Analysis results loaded',
      onFailure: 'Failed to load analysis results',
    }),
  ),
);
