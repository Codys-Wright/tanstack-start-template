import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { SectionRpc } from '../domain/index.js';

/**
 * SectionClient - RPC client for the Section feature.
 *
 * Provides:
 * - SectionClient.query("section_listByCourse", ...) - for read queries
 * - SectionClient.mutation("section_create") - for mutations
 * - SectionClient.runtime - for custom atoms
 * - SectionClient.layer - for Effect services
 * - SectionClient (as Context.Tag) - yields the raw RPC client
 */
export class SectionClient extends AtomRpc.Tag<SectionClient>()('@course/SectionClient', {
  group: SectionRpc,
  protocol: RpcProtocol,
}) {}
