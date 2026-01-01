import { makeRpcConfigLayer } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ActiveQuizRpc } from '../domain/index.js';

// Create a fresh protocol layer for this client to avoid sharing issues
const ActiveQuizRpcProtocol = makeRpcConfigLayer('/api/rpc');

/**
 * ActiveQuizClient - RPC client for the Active Quiz feature.
 *
 * Provides:
 * - ActiveQuizClient.query("active_quiz_list", ...) - for read queries
 * - ActiveQuizClient.mutation("active_quiz_upsert") - for mutations
 * - ActiveQuizClient.runtime - for custom atoms
 * - ActiveQuizClient.layer - for Effect services
 * - ActiveQuizClient (as Context.Tag) - yields the raw RPC client
 */
export class ActiveQuizClient extends AtomRpc.Tag<ActiveQuizClient>()('@quiz/ActiveQuizClient', {
  group: ActiveQuizRpc,
  protocol: ActiveQuizRpcProtocol,
}) {}
