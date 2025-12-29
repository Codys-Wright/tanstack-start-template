import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { QuizzesRpc } from '../domain/index.js';

/**
 * QuizClient - RPC client for the Quiz feature.
 *
 * Provides:
 * - QuizClient.query("quiz_list", ...) - for read queries
 * - QuizClient.mutation("quiz_upsert") - for mutations
 * - QuizClient.runtime - for custom atoms
 * - QuizClient.layer - for Effect services
 * - QuizClient (as Context.Tag) - yields the raw RPC client
 */
export class QuizClient extends AtomRpc.Tag<QuizClient>()('@quiz/QuizClient', {
  group: QuizzesRpc,
  protocol: RpcProtocol,
}) {}
