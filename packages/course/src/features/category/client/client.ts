import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { CategoryRpc } from '../domain/index.js';

/**
 * CategoryClient - RPC client for the Category feature.
 *
 * Provides:
 * - CategoryClient.query("category_list", ...) - for read queries
 * - CategoryClient.mutation("category_create") - for mutations
 * - CategoryClient.runtime - for custom atoms
 * - CategoryClient.layer - for Effect services
 * - CategoryClient (as Context.Tag) - yields the raw RPC client
 */
export class CategoryClient extends AtomRpc.Tag<CategoryClient>()('@course/CategoryClient', {
  group: CategoryRpc,
  protocol: RpcProtocol,
}) {}
