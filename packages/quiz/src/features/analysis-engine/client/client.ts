import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { AnalysisEngineRpc } from '../domain/index.js';

/**
 * AnalysisEngineClient - RPC client for the Analysis Engine feature.
 *
 * Provides:
 * - AnalysisEngineClient.query("engine_list", ...) - for read queries
 * - AnalysisEngineClient.mutation("engine_upsert") - for mutations
 * - AnalysisEngineClient.runtime - for custom atoms
 * - AnalysisEngineClient.layer - for Effect services
 * - AnalysisEngineClient (as Context.Tag) - yields the raw RPC client
 */
export class AnalysisEngineClient extends AtomRpc.Tag<AnalysisEngineClient>()(
  '@quiz/AnalysisEngineClient',
  {
    group: AnalysisEngineRpc,
    protocol: RpcProtocol,
  },
) {}
