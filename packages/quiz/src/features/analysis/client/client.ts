import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { AnalysisRpc } from '../domain/index.js';

/**
 * AnalysisClient - RPC client for the Analysis feature.
 *
 * Provides:
 * - AnalysisClient.query("analysis_list", ...) - for read queries
 * - AnalysisClient.mutation("analysis_analyze") - for mutations
 * - AnalysisClient.runtime - for custom atoms
 * - AnalysisClient.layer - for Effect services
 * - AnalysisClient (as Context.Tag) - yields the raw RPC client
 */
export class AnalysisClient extends AtomRpc.Tag<AnalysisClient>()('@quiz/AnalysisClient', {
  group: AnalysisRpc,
  protocol: RpcProtocol,
}) {}
