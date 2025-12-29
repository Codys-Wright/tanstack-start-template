import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import type { AnalysisEngineId } from './analysis-engine/schema.js';
import type {
  AnalysisResult,
  AnalysisSummary,
  AnalyzeResponseRequest,
  BatchAnalyzeRequest,
} from './schema.js';
import type { ResponseId } from '../responses/schema.js';
import { Data, Effect } from 'effect';

export class AnalysisClient extends AtomRpc.Tag<AnalysisClient>()('@quiz/analysis/Client', {
  group: 'AnalysisEngine',
  protocol: RpcProtocol,
}) {}

export const makeAnalysisAtoms = (client: AnalysisClient) => {
  const runtime = client.runtime;

  // Remote atom for getting analysis results (empty by default to avoid UUID validation errors)
  const analysisRemoteAtom = runtime.atom(Effect.succeed([] as ReadonlyArray<AnalysisResult>));

  // Remote atom for getting all analysis results
  const allAnalysisRemoteAtom = runtime.atom(
    Effect.fn(function* () {
      return yield* client('list');
    }),
  );

  // Remote atom for getting analysis summary (null by default to avoid UUID validation errors)
  const analysisSummaryRemoteAtom = runtime.atom(Effect.succeed(null as AnalysisSummary | null));

  // Export all atoms
  return {
    analysisAtom: analysisRemoteAtom,
    allAnalysisAtom: allAnalysisRemoteAtom,
    analysisSummaryAtom: analysisSummaryRemoteAtom,
  };
};
