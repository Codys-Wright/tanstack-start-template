import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { InstructorRpc } from '../domain/index.js';

/**
 * InstructorClient - RPC client for the Instructor feature.
 *
 * Provides:
 * - InstructorClient.query("instructor_list", ...) - for read queries
 * - InstructorClient.mutation("instructor_apply") - for mutations
 * - InstructorClient.runtime - for custom atoms
 * - InstructorClient.layer - for Effect services
 * - InstructorClient (as Context.Tag) - yields the raw RPC client
 */
export class InstructorClient extends AtomRpc.Tag<InstructorClient>()('@course/InstructorClient', {
  group: InstructorRpc,
  protocol: RpcProtocol,
}) {}
