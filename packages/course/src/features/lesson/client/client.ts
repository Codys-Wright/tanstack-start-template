import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { LessonRpc } from '../domain/index.js';

/**
 * LessonClient - RPC client for the Lesson feature.
 *
 * Provides:
 * - LessonClient.query("lesson_getById", ...) - for read queries
 * - LessonClient.mutation("lesson_create") - for mutations
 * - LessonClient.runtime - for custom atoms
 * - LessonClient.layer - for Effect services
 * - LessonClient (as Context.Tag) - yields the raw RPC client
 */
export class LessonClient extends AtomRpc.Tag<LessonClient>()('@course/LessonClient', {
  group: LessonRpc,
  protocol: RpcProtocol,
}) {}
