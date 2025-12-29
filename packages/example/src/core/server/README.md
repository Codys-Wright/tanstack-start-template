# Core Server Layer

The core server layer provides package-level infrastructure for composing feature layers, creating runtimes, and defining the package's HTTP API.

## Files

```
core/server/
├── api.ts         # Package-level HttpApi (combines feature API groups)
├── layer.ts       # Combined layers (ExampleApiLive, ExampleRpcLive)
├── runtime.ts     # Server runtime for SSR (ManagedRuntime)
└── index.ts       # Public exports
```

## File Creation Order

1. **api.ts** - Define the package-level HttpApi
2. **layer.ts** - Compose feature layers into package-level layers
3. **runtime.ts** - Create the server runtime for SSR
4. **index.ts** - Export everything

## api.ts - Package-Level HttpApi

The HttpApi combines all feature API groups into a single API definition.

```ts
import { FeatureApiGroup } from '@/features/feature';
import * as HttpApi from '@effect/platform/HttpApi';

export class ExampleApi extends HttpApi.make('example-api')
  .add(FeatureApiGroup)
  // Add more feature groups as needed:
  // .add(AnotherFeatureApiGroup)
{}
```

### Why a Package-Level API?

1. **Single Entry Point** - Apps can mount the entire package's API at once
2. **Shared Configuration** - Common middleware, error handling, etc.
3. **Documentation** - Scalar/OpenAPI docs cover all endpoints
4. **Composability** - Apps can merge multiple package APIs

## layer.ts - Combined Layers

This file exports the composed layers that apps use to integrate the package.

### HTTP API Layer

```ts
import { FeatureApiLive, FeatureRpcLive } from '../../features/feature/server';
import * as HttpApiScalar from '@effect/platform/HttpApiScalar';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { ExampleApi } from './api';

/**
 * ExampleApiLive - Complete HTTP API route layer for the package.
 * 
 * Creates a self-contained route layer using HttpLayerRouter.addHttpApi.
 * Includes its own Scalar docs at /api/example/docs.
 */
export const ExampleApiLive = Layer.mergeAll(
  // Add the HttpApi routes
  HttpLayerRouter.addHttpApi(ExampleApi),
  
  // Add Scalar documentation
  HttpApiScalar.layerHttpLayerRouter({
    api: ExampleApi,
    path: '/api/example/docs',
    scalar: {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      defaultOpenAllTags: true,
    },
  }),
).pipe(
  // Provide feature API handlers
  Layer.provide(FeatureApiLive),
  Layer.provide(HttpServer.layerContext),
);
```

### RPC Layer

```ts
/**
 * ExampleRpcLive - RPC handlers layer for the package.
 * 
 * For single-feature packages, this may just re-export the feature's RPC layer.
 * For multi-feature packages, merge multiple RPC layers.
 */
export const ExampleRpcLive = FeatureRpcLive;

// For multiple features:
// export const ExampleRpcLive = Layer.mergeAll(
//   FeatureRpcLive,
//   AnotherFeatureRpcLive,
// );
```

### App Integration

Apps consume these layers to mount the package's API:

```ts
// In app server setup
import { ExampleApiLive, ExampleRpcLive } from "@example/server";
import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Layer from "effect/Layer";

// HTTP API routes
const AllApiRoutes = Layer.mergeAll(
  ExampleApiLive,
  TodoApiLive,
  // ... other package API layers
);

// RPC routes
const AllRpcHandlers = Layer.mergeAll(
  ExampleRpcLive,
  TodoRpcLive,
  // ... other package RPC layers
);

const RpcRouter = RpcServer.layerHttpRouter({
  route: "/rpc",
  groups: [ExampleRpc, TodoRpc],  // RPC groups from domain
}).pipe(Layer.provide(AllRpcHandlers));
```

## runtime.ts - Server Runtime

The server runtime provides a `ManagedRuntime` for executing server-side Effects.

```ts
import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { AuthService } from '@auth/server';
import { FeatureService } from '../../features/feature/server/index.js';

// Persist memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@example/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the package.
 */
export const ExampleServerLayer = Layer.merge(
  AuthService.Default,      // Auth from @auth package
  FeatureService.Default,   // Feature service from this package
);

/**
 * Server runtime for the package.
 * 
 * Use this in server functions to run Effects with proper services.
 */
export const ExampleServerRuntime = globalValue(
  Symbol.for('@example/server-runtime'),
  () => ManagedRuntime.make(ExampleServerLayer, memoMap),
);

export type ExampleServerRuntime = typeof ExampleServerRuntime;
```

### Using the Runtime

Server functions use the runtime to execute Effects:

```ts
import { ExampleServerRuntime } from '../../../core/server/runtime.js';
import { FeatureService } from '../../server/index.js';

export const loadFeatures = createServerFn({ method: 'GET' }).handler(async () => {
  const exit = await ExampleServerRuntime.runPromiseExit(
    Effect.gen(function* () {
      const service = yield* FeatureService;
      return yield* service.list();
    }),
  );
  
  // Handle exit (success/failure)
  return Result.fromExit(exit);
});
```

### Why globalValue?

`globalValue` ensures the runtime and memoMap persist across hot module reloads during development. Without it, each reload would create a new runtime, causing:
- Lost database connections
- Memory leaks
- Inconsistent state

### Adding Dependencies

When adding new features, update `ExampleServerLayer`:

```ts
export const ExampleServerLayer = Layer.mergeAll(
  AuthService.Default,
  FeatureService.Default,
  NewFeatureService.Default,  // Add new services here
);
```

## index.ts - Public Exports

```ts
export * from './api';
export * from './layer';
// Note: runtime is exported from server.ts at package root
```

## Package Entry Points

### server.ts (Package Root)

```ts
// packages/example/src/server.ts
export * from './core/server';
export { ExampleServerRuntime, ExampleServerLayer } from './core/server/runtime';
export { FeatureService } from './features/feature/server';
```

Apps import server-side code from `@example/server`:

```ts
import { 
  ExampleApiLive, 
  ExampleRpcLive, 
  ExampleServerRuntime,
  FeatureService 
} from '@example/server';
```

## Adding a New Feature

When adding a new feature to the package:

1. **Create the feature** in `features/new-feature/`
2. **Update api.ts** - Add the feature's API group:
   ```ts
   export class ExampleApi extends HttpApi.make('example-api')
     .add(FeatureApiGroup)
     .add(NewFeatureApiGroup)  // Add here
   {}
   ```

3. **Update layer.ts** - Provide the feature's handlers:
   ```ts
   export const ExampleApiLive = Layer.mergeAll(
     HttpLayerRouter.addHttpApi(ExampleApi),
     // ...
   ).pipe(
     Layer.provide(FeatureApiLive),
     Layer.provide(NewFeatureApiLive),  // Add here
   );
   
   export const ExampleRpcLive = Layer.mergeAll(
     FeatureRpcLive,
     NewFeatureRpcLive,  // Add here
   );
   ```

4. **Update runtime.ts** - Add the service:
   ```ts
   export const ExampleServerLayer = Layer.mergeAll(
     AuthService.Default,
     FeatureService.Default,
     NewFeatureService.Default,  // Add here
   );
   ```

5. **Update server.ts** - Export the new service:
   ```ts
   export { NewFeatureService } from './features/new-feature/server';
   ```

## Key Principles

1. **Package-Level Composition** - Feature layers combine into package layers
2. **Single Runtime** - One ManagedRuntime per package for SSR
3. **Hot Reload Safe** - Use globalValue for dev experience
4. **Self-Documenting** - Include Scalar docs at a predictable path
5. **Modular** - Features are independent, composed at this level
