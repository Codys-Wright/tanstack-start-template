import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { TodoRpc } from '../domain/index.js';

/**
 * TodoClient - RPC client for the Todo feature.
 *
 * Provides:
 * - TodoClient.query("todo_list", ...) - for read queries
 * - TodoClient.mutation("todo_create") - for mutations
 * - TodoClient.runtime - for custom atoms
 * - TodoClient.layer - for Effect services
 * - TodoClient (as Context.Tag) - yields the raw RPC client
 */
export class TodoClient extends AtomRpc.Tag<TodoClient>()('@todo/Client', {
  group: TodoRpc,
  protocol: RpcProtocol,
}) {}
