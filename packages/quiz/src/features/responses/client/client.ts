import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ResponsesRpc } from '../domain/index.js';

/**
 * ResponsesClient - RPC client for the Responses feature.
 *
 * Provides:
 * - ResponsesClient.query("response_list", ...) - for read queries
 * - ResponsesClient.mutation("response_upsert") - for mutations
 * - ResponsesClient.runtime - for custom atoms
 * - ResponsesClient.layer - for Effect services
 * - ResponsesClient (as Context.Tag) - yields the raw RPC client
 */
export class ResponsesClient extends AtomRpc.Tag<ResponsesClient>()('@quiz/ResponsesClient', {
  group: ResponsesRpc,
  protocol: RpcProtocol,
}) {}
