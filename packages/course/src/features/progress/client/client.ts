import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ProgressRpc } from '../domain/index.js';

/**
 * ProgressClient - RPC client for the Progress feature.
 *
 * Provides:
 * - ProgressClient.query("progress_listByCourse", ...) - for read queries
 * - ProgressClient.mutation("progress_startLesson") - for mutations
 * - ProgressClient.runtime - for custom atoms
 * - ProgressClient.layer - for Effect services
 * - ProgressClient (as Context.Tag) - yields the raw RPC client
 */
export class ProgressClient extends AtomRpc.Tag<ProgressClient>()('@course/ProgressClient', {
  group: ProgressRpc,
  protocol: RpcProtocol,
}) {}
