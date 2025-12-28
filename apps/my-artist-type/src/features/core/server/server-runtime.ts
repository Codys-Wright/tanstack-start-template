import { AuthService } from '@auth/server';
import { TodosService } from '@todo/server';
import * as Effect from 'effect/Effect';
import { globalValue } from 'effect/GlobalValue';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@my-artist-type/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

// Merge AuthService and TodosService layers
const serverLayer = Layer.merge(AuthService.Default, TodosService.Default);

// Use globalValue to persist the runtime across hot reloads
// This prevents "ManagedRuntime disposed" errors during HMR
export const serverRuntime = globalValue(Symbol.for('@my-artist-type/server-runtime'), () =>
  ManagedRuntime.make(serverLayer, memoMap),
);
