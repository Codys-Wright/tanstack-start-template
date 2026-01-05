import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ReviewRpc } from '../domain/index.js';

/**
 * ReviewClient - RPC client for the Review feature.
 *
 * Provides:
 * - ReviewClient.query("review_listByCourse", ...) - for read queries
 * - ReviewClient.mutation("review_create") - for mutations
 * - ReviewClient.runtime - for custom atoms
 * - ReviewClient.layer - for Effect services
 * - ReviewClient (as Context.Tag) - yields the raw RPC client
 */
export class ReviewClient extends AtomRpc.Tag<ReviewClient>()('@course/ReviewClient', {
  group: ReviewRpc,
  protocol: RpcProtocol,
}) {}
