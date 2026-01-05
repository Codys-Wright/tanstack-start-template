import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { CourseRpc } from '../domain/index.js';

/**
 * CourseClient - RPC client for the Course feature.
 *
 * Provides:
 * - CourseClient.query("course_list", ...) - for read queries
 * - CourseClient.mutation("course_create") - for mutations
 * - CourseClient.runtime - for custom atoms
 * - CourseClient.layer - for Effect services
 * - CourseClient (as Context.Tag) - yields the raw RPC client
 */
export class CourseClient extends AtomRpc.Tag<CourseClient>()('@course/CourseClient', {
  group: CourseRpc,
  protocol: RpcProtocol,
}) {}
