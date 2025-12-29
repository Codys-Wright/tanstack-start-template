import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { FeatureRpc } from '../domain/index.js';

/**
 * FeatureClient - RPC client for the Feature feature.
 *
 * Provides:
 * - FeatureClient.query("feature_list", ...) - for read queries
 * - FeatureClient.mutation("feature_create") - for mutations
 * - FeatureClient.runtime - for custom atoms
 * - FeatureClient.layer - for Effect services
 * - FeatureClient (as Context.Tag) - yields the raw RPC client
 */
export class FeatureClient extends AtomRpc.Tag<FeatureClient>()('@example/FeatureClient', {
  group: FeatureRpc,
  protocol: RpcProtocol,
}) {}
