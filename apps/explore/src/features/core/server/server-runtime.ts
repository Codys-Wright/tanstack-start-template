/**
 * Server Runtime for Explore SSE Demo
 *
 * Minimal runtime setup for SSE streaming.
 */

import * as Effect from 'effect/Effect';
import { globalValue } from 'effect/GlobalValue';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@explore/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

// Minimal server layer - just empty for now, can add services later
const serverLayer = Layer.empty;

// Use globalValue to persist the runtime across hot reloads
// This prevents "ManagedRuntime disposed" errors during HMR
export const serverRuntime = globalValue(Symbol.for('@explore/server-runtime'), () =>
  ManagedRuntime.make(serverLayer, memoMap),
);
