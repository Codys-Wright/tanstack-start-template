/**
 * TodoServerRuntime - Server runtime for the @todo package.
 *
 * This runtime provides all layers needed for the todo feature:
 * - TodoService for CRUD operations
 * - AuthService for authentication
 *
 * Apps can either:
 * 1. Use this runtime directly for todo-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { AuthService } from '@auth/server';

import { TodoService } from '../../features/todo/server/index.js';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@todo/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the todo package.
 * Includes AuthService for authentication and TodoService for todos.
 */
export const TodoServerLayer = Layer.merge(AuthService.Default, TodoService.Default);

/**
 * Server runtime for the todo package.
 *
 * Use this runtime to run server-side effects that need TodoService and AuthService.
 *
 * @example
 * ```ts
 * import { TodoServerRuntime } from '@todo/server';
 *
 * const result = await TodoServerRuntime.runPromise(
 *   Effect.gen(function* () {
 *     const service = yield* TodoService;
 *     return yield* service.list(userId);
 *   })
 * );
 * ```
 */
export const TodoServerRuntime = globalValue(Symbol.for('@todo/server-runtime'), () =>
  ManagedRuntime.make(TodoServerLayer, memoMap),
);

/**
 * Type helper for the todo server runtime.
 */
export type TodoServerRuntime = typeof TodoServerRuntime;
