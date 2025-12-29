# Server Layer

The server layer contains business logic services and handler implementations for RPC and HTTP API endpoints.

## Files

```
server/
├── service.ts     # Business logic service (Effect.Service)
├── rpc-live.ts    # RPC handler implementations
├── api-live.ts    # HTTP API handler implementations
└── index.ts       # Public exports
```

## File Creation Order

1. **service.ts** - Define business logic service
2. **rpc-live.ts** - Implement RPC handlers using the service
3. **api-live.ts** - Implement HTTP API handlers using the service
4. **index.ts** - Export everything

## service.ts - Business Logic Service

The service encapsulates business logic and orchestrates repository calls.

### Defining a Service

```ts
import * as Effect from 'effect/Effect';
import { FeatureRepository } from '../database';
import type { CreateFeatureInput, FeatureId, UpdateFeatureInput } from '../domain';

export class FeatureService extends Effect.Service<FeatureService>()('FeatureService', {
  // Declare dependencies - they will be auto-provided
  dependencies: [FeatureRepository.Default],
  
  // Define the service implementation
  effect: Effect.gen(function* () {
    const repo = yield* FeatureRepository;

    return {
      list: () => repo.list(),
      getById: (id: FeatureId) => repo.getById(id),
      create: (input: CreateFeatureInput) => repo.create(input),
      update: (id: FeatureId, input: UpdateFeatureInput) => repo.update(id, input),
      remove: (id: FeatureId) => repo.remove(id),
    } as const;
  }),
}) {}
```

### Effect.Service Pattern

`Effect.Service` creates:
- A **Context Tag** for dependency injection
- A **Default Layer** that provides the implementation
- Automatic dependency resolution via `dependencies`

```ts
// The service can be yielded from any Effect
const program = Effect.gen(function* () {
  const service = yield* FeatureService;
  return yield* service.list();
});

// Run with the Default layer
Effect.runPromise(program.pipe(
  Effect.provide(FeatureService.Default)
));
```

### Service Responsibilities

The service layer should:
- **Orchestrate** - Combine multiple repository calls
- **Validate** - Apply business rules beyond schema validation
- **Transform** - Convert between internal and external representations
- **Authorize** - Check user permissions (if needed)

For simple CRUD, the service may just delegate to the repository. As complexity grows, add business logic here.

### Adding Business Logic

```ts
export class FeatureService extends Effect.Service<FeatureService>()('FeatureService', {
  dependencies: [FeatureRepository.Default],
  effect: Effect.gen(function* () {
    const repo = yield* FeatureRepository;

    return {
      // Simple delegation
      list: () => repo.list(),
      
      // Business logic example
      createWithValidation: (input: CreateFeatureInput) =>
        Effect.gen(function* () {
          // Check for duplicate names
          const existing = yield* repo.findByName(input.name);
          if (Option.isSome(existing)) {
            return yield* Effect.fail(
              new FeatureValidationError({
                field: 'name',
                message: 'Feature with this name already exists',
              })
            );
          }
          return yield* repo.create(input);
        }),
    } as const;
  }),
}) {}
```

## rpc-live.ts - RPC Handler Implementations

RPC handlers implement the methods defined in `domain/rpc.ts`.

### Implementing RPC Handlers

```ts
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { FeatureRpc } from '../domain/index';
import { FeatureService } from './service';

export const FeatureRpcLive = FeatureRpc.toLayer(
  Effect.gen(function* () {
    const features = yield* FeatureService;

    return FeatureRpc.of({
      // Method names are prefixed (feature_list, feature_getById, etc.)
      feature_list: Effect.fn(function* () {
        yield* Effect.log(`[RPC] Listing features`);
        return yield* features.list();
      }),

      feature_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting feature ${id}`);
        return yield* features.getById(id);
      }),

      feature_create: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating feature "${input.name}"`);
        return yield* features.create(input);
      }),

      feature_update: Effect.fn(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating feature ${id}`);
        return yield* features.update(id, input);
      }),

      feature_remove: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Removing feature ${id}`);
        return yield* features.remove(id);
      }),
    });
  }),
).pipe(Layer.provide(FeatureService.Default));  // Provide service dependency
```

### Key Concepts

1. **`FeatureRpc.toLayer()`** - Converts handler implementations to a Layer
2. **`FeatureRpc.of()`** - Type-safe handler object builder
3. **`Effect.fn()`** - Creates an Effect function with proper typing
4. **`Layer.provide()`** - Provides service dependency to the layer

### Handler Method Names

Method names in the handler must match the prefixed names from the RPC definition:

```ts
// In rpc.ts:
RpcGroup.make(
  Rpc.make('list', { ... }),
  Rpc.make('getById', { ... }),
).prefix('feature_')

// In rpc-live.ts handlers:
feature_list: ...     // 'feature_' + 'list'
feature_getById: ...  // 'feature_' + 'getById'
```

## api-live.ts - HTTP API Handler Implementations

HTTP API handlers implement REST endpoints defined in `domain/api.ts`.

### Implementing HTTP API Handlers

```ts
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ExampleApi } from '../../../core/server/api';
import { FeatureService } from './service';

export const FeatureApiLive = HttpApiBuilder.group(ExampleApi, 'features', (handlers) =>
  handlers
    // GET /features
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Listing features`);
        const features = yield* FeatureService;
        return yield* features.list();
      }),
    )
    
    // GET /features/:id
    .handle('getById', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Getting feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.getById(path.id);
      }),
    )
    
    // POST /features
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Creating feature`);
        const features = yield* FeatureService;
        return yield* features.create(payload);
      }),
    )
    
    // PATCH /features/:id
    .handle('update', ({ path, payload }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Updating feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.update(path.id, payload);
      }),
    )
    
    // DELETE /features/:id
    .handle('remove', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log(`[HTTP API] Removing feature ${path.id}`);
        const features = yield* FeatureService;
        return yield* features.remove(path.id);
      }),
    ),
).pipe(Layer.provide(FeatureService.Default));
```

### Key Concepts

1. **`HttpApiBuilder.group()`** - Creates handlers for an API group
   - First arg: The package-level HttpApi (ExampleApi)
   - Second arg: The group name ('features')
   - Third arg: Handler builder function

2. **Handler Context** - Each handler receives:
   - `path` - Path parameters (e.g., `{ id: FeatureId }`)
   - `payload` - Request body
   - `urlParams` - Query parameters
   - `headers` - Request headers

3. **Service Access** - Yield the service inside handlers:
   ```ts
   const features = yield* FeatureService;
   ```

### Handler Names

Handler names must match endpoint names from the API definition:

```ts
// In api.ts:
HttpApiEndpoint.get('list', '/features')
HttpApiEndpoint.get('getById', '/features/:id')

// In api-live.ts:
.handle('list', ...)
.handle('getById', ...)
```

## index.ts - Public Exports

```ts
export * from './service';
export * from './rpc-live';
export * from './api-live';
```

## Layer Composition

Both `FeatureRpcLive` and `FeatureApiLive` are Layers that need to be composed at the package level. See `core/server/layer.ts` for how they're combined.

## Testing Services

Services can be tested by providing mock dependencies:

```ts
import { Effect, Layer } from 'effect';
import { FeatureService } from './service';
import { FeatureRepository } from '../database';

// Create a mock repository
const MockRepo = Layer.succeed(FeatureRepository, {
  list: () => Effect.succeed([mockFeature]),
  getById: (id) => Effect.succeed(mockFeature),
  // ... other methods
});

// Test with mock
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* FeatureService;
    return yield* service.list();
  }).pipe(
    Effect.provide(FeatureService.Default),
    Effect.provide(MockRepo)
  )
);
```

## Key Principles

1. **Single Responsibility** - Service handles business logic, handlers handle protocol
2. **Dependency Injection** - Use Effect.Service for testable, composable code
3. **Type Safety** - All handlers are fully typed from domain definitions
4. **Logging** - Add structured logging for observability
5. **Error Propagation** - Let domain errors flow through to clients
