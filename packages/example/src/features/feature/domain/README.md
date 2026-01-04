# Domain Layer

The domain layer defines the **contract** for your feature. It contains schemas, branded types, errors, and API definitions that are shared between client and server.

## Files

```
domain/
├── schema.ts      # Effect schemas, branded types, domain errors
├── rpc.ts         # RPC endpoint definitions (for typed RPC calls)
├── api.ts         # HTTP API endpoint definitions (for REST)
└── index.ts       # Public exports
```

## File Creation Order

1. **schema.ts** - Define your data types first
2. **rpc.ts** - Define RPC endpoints using the schemas
3. **api.ts** - Define HTTP API endpoints using the schemas
4. **index.ts** - Export everything

## schema.ts - Data Types & Errors

### Branded Types for IDs

Use branded types for entity IDs to prevent mixing up different ID types:

```ts
import * as S from "effect/Schema";

// Branded ID type - prevents passing wrong ID types
export const FeatureId = S.String.pipe(S.brand("FeatureId"));
export type FeatureId = typeof FeatureId.Type;
```

### Entity Schemas

Define the main entity with validation rules:

```ts
export const Feature = S.Struct({
  id: FeatureId,
  name: S.String.pipe(S.minLength(1), S.maxLength(100)),
  description: S.String.pipe(S.maxLength(500)),
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
});
export type Feature = typeof Feature.Type;
```

### Input Schemas

Separate schemas for create/update operations:

```ts
// Create input - required fields only
export const CreateFeatureInput = S.Struct({
  name: S.String.pipe(S.minLength(1), S.maxLength(100)),
  description: S.String.pipe(S.maxLength(500)),
});
export type CreateFeatureInput = typeof CreateFeatureInput.Type;

// Update input - all fields optional (using Option)
export const UpdateFeatureInput = S.Struct({
  name: S.optionalWith(S.String.pipe(S.minLength(1), S.maxLength(100)), {
    as: "Option",
  }),
  description: S.optionalWith(S.String.pipe(S.maxLength(500)), {
    as: "Option",
  }),
});
export type UpdateFeatureInput = typeof UpdateFeatureInput.Type;
```

### Tagged Errors

Use `S.TaggedError` for typed domain errors:

```ts
export class FeatureNotFound extends S.TaggedError<FeatureNotFound>()(
  "FeatureNotFound",
  { id: FeatureId }
) {}

export class FeatureValidationError extends S.TaggedError<FeatureValidationError>()(
  "FeatureValidationError",
  {
    field: S.String,
    message: S.String,
  }
) {}
```

Benefits of TaggedError:

- **Type-safe error handling** - Errors are in the Effect error channel
- **Discriminated unions** - Use `_tag` to switch on error types
- **Serializable** - Can be sent over RPC/API boundaries
- **Pattern matching** - Use `Effect.catchTag('FeatureNotFound', ...)`

## rpc.ts - RPC Endpoint Definitions

RPC provides typed, schema-validated remote procedure calls.

### Defining an RPC Group

```ts
import * as Rpc from "@effect/rpc/Rpc";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as S from "effect/Schema";
import {
  CreateFeatureInput,
  Feature,
  FeatureId,
  FeatureNotFound,
  UpdateFeatureInput,
} from "./schema";

export class FeatureRpc extends RpcGroup.make(
  // Query - no payload, returns array
  Rpc.make("list", {
    success: S.Array(Feature),
  }),

  // Query with payload and error
  Rpc.make("getById", {
    success: Feature,
    error: FeatureNotFound,
    payload: { id: FeatureId },
  }),

  // Mutation with payload
  Rpc.make("create", {
    success: Feature,
    payload: { input: CreateFeatureInput },
  }),

  // Mutation with ID and payload
  Rpc.make("update", {
    success: Feature,
    error: FeatureNotFound,
    payload: { id: FeatureId, input: UpdateFeatureInput },
  }),

  // Delete - returns void
  Rpc.make("remove", {
    success: S.Void,
    error: FeatureNotFound,
    payload: { id: FeatureId },
  })
).prefix("feature_") {} // Prefix all method names
```

### RPC Method Anatomy

```ts
Rpc.make('methodName', {
  success: Schema,        // Required: return type schema
  error: TaggedError,     // Optional: error type (must be TaggedError)
  payload: { ... },       // Optional: input parameters
})
```

### Method Naming Convention

Use `.prefix('feature_')` to namespace all methods. The resulting method names will be:

- `feature_list`
- `feature_getById`
- `feature_create`
- `feature_update`
- `feature_remove`

This prevents naming collisions when combining multiple RPC groups.

## api.ts - HTTP API Endpoint Definitions

HTTP API provides RESTful endpoints using `@effect/platform`.

### Defining an API Group

```ts
import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint";
import * as HttpApiGroup from "@effect/platform/HttpApiGroup";
import * as S from "effect/Schema";
import {
  Feature,
  FeatureId,
  CreateFeatureInput,
  UpdateFeatureInput,
  FeatureNotFound,
} from "./schema";

export class FeatureApiGroup extends HttpApiGroup.make("features")
  // GET /features - List all
  .add(HttpApiEndpoint.get("list", "/features").addSuccess(S.Array(Feature)))

  // GET /features/:id - Get by ID
  .add(
    HttpApiEndpoint.get("getById", "/features/:id")
      .setPath(S.Struct({ id: FeatureId }))
      .addSuccess(Feature)
      .addError(FeatureNotFound)
  )

  // POST /features - Create
  .add(
    HttpApiEndpoint.post("create", "/features")
      .setPayload(CreateFeatureInput)
      .addSuccess(Feature)
  )

  // PATCH /features/:id - Update
  .add(
    HttpApiEndpoint.patch("update", "/features/:id")
      .setPath(S.Struct({ id: FeatureId }))
      .setPayload(UpdateFeatureInput)
      .addSuccess(Feature)
      .addError(FeatureNotFound)
  )

  // DELETE /features/:id - Delete
  .add(
    HttpApiEndpoint.del("remove", "/features/:id")
      .setPath(S.Struct({ id: FeatureId }))
      .addSuccess(S.Void)
      .addError(FeatureNotFound)
  ) {}
```

### Endpoint Methods

| Method                    | Use Case          |
| ------------------------- | ----------------- |
| `HttpApiEndpoint.get()`   | Read operations   |
| `HttpApiEndpoint.post()`  | Create operations |
| `HttpApiEndpoint.patch()` | Partial updates   |
| `HttpApiEndpoint.put()`   | Full replacement  |
| `HttpApiEndpoint.del()`   | Delete operations |

### Endpoint Configuration

```ts
HttpApiEndpoint.get("name", "/path/:param")
  .setPath(Schema) // Path parameters (e.g., :id)
  .setPayload(Schema) // Request body
  .setUrlParams(Schema) // Query parameters
  .addSuccess(Schema) // Success response
  .addError(Error); // Error response (TaggedError)
```

## index.ts - Public Exports

```ts
export * from "./schema";
export * from "./rpc";
export * from "./api";
```

## RPC vs HTTP API

Both are defined and can coexist. Choose based on your needs:

| Aspect            | RPC                          | HTTP API                 |
| ----------------- | ---------------------------- | ------------------------ |
| **Primary Use**   | Client atoms, internal calls | External REST API        |
| **Transport**     | Binary/JSON over HTTP POST   | Standard REST verbs      |
| **Caching**       | Application-level            | HTTP caching possible    |
| **Documentation** | TypeScript types             | OpenAPI/Scalar docs      |
| **Best For**      | SPA/internal clients         | Third-party integrations |

## Key Principles

1. **Schema-First Design** - Define schemas before implementations
2. **Branded IDs** - Prevent ID type confusion at compile time
3. **Tagged Errors** - Type-safe error handling across boundaries
4. **Validation Built-In** - Schemas validate automatically
5. **Shared Contract** - Same types for client and server
