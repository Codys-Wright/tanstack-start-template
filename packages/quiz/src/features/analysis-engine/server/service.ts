import * as Effect from 'effect/Effect';

// Stub service for AnalysisEngine - needs repository implementation
export class AnalysisEngineService extends Effect.Service<AnalysisEngineService>()(
  'AnalysisEngineService',
  {
    effect: Effect.succeed({
      list: () => Effect.succeed([]),
      getById: (_id: string) => Effect.succeed(null),
    } as const),
  },
) {}
