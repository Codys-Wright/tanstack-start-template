# @example Package

A reference implementation for building reusable feature packages in the TanStack Start + Effect monorepo template. This package demonstrates the complete vertical slice architecture from database to UI.

## Overview

The `@example` package shows how to create a self-contained feature module that can be mounted in any app. It includes:

- **Database Layer**: Migrations, seeds, and repository
- **Domain Layer**: Schemas, types, RPC definitions, and HTTP API definitions
- **Server Layer**: Services, RPC handlers, and HTTP API handlers
- **Client Layer**: Atoms, RPC client, and React components

## Package Structure

```
packages/example/
├── src/
│   ├── index.ts              # Client + Domain exports
│   ├── server.ts             # Server-side exports
│   ├── database.ts           # Database exports
│   │
│   ├── core/
│   │   └── server/           # Package-level server infrastructure
│   │       ├── api.ts        # Combined HTTP API
│   │       ├── layer.ts      # Combined layers (ApiLive, RpcLive)
│   │       ├── runtime.ts    # Server runtime for SSR
│   │       └── index.ts
│   │
│   ├── database/
│   │   ├── migrations/       # SQL migrations
│   │   │   └── 0001_*.ts
│   │   ├── migrations.ts     # Migration discovery
│   │   ├── seeds.ts          # Data seeders
│   │   └── index.ts
│   │
│   └── features/
│       └── feature/          # Individual feature module
│           ├── domain/       # Schemas, RPC, API definitions
│           ├── database/     # Repository
│           ├── server/       # Service, RPC/API handlers
│           └── client/       # Atoms, components, pages
│
└── package.json
```

## File Creation Order

When creating a new feature, follow this order to ensure dependencies are satisfied:

### 1. Domain Layer (First)

```
features/[name]/domain/
├── schema.ts      # 1. Define schemas, IDs, error types
├── rpc.ts         # 2. Define RPC endpoints
├── api.ts         # 3. Define HTTP API endpoints
└── index.ts       # 4. Export everything
```

### 2. Database Layer

```
features/[name]/database/
├── repo.ts        # 5. Implement repository with SQL queries
└── index.ts       # 6. Export repository

database/
├── migrations/
│   └── 0001_*.ts  # 7. Create migration file
├── migrations.ts  # 8. Register migrations
└── seeds.ts       # 9. Create seeders (optional)
```

### 3. Server Layer

```
features/[name]/server/
├── service.ts     # 10. Create service (wraps repository)
├── rpc-live.ts    # 11. Implement RPC handlers
├── api-live.ts    # 12. Implement HTTP API handlers
└── index.ts       # 13. Export everything

core/server/
├── api.ts         # 14. Add feature API to package API
├── layer.ts       # 15. Add feature layers to package layers
└── runtime.ts     # 16. Create SSR runtime
```

### 4. Client Layer (Last)

```
features/[name]/client/
├── client.ts      # 17. Create RPC client
├── atoms.ts       # 18. Create reactive atoms
├── presentation/
│   ├── components/   # 19. Reusable UI components
│   ├── views/        # 20. Feature views (list, detail, etc.)
│   └── routes/       # 21. Page components + server functions
└── index.ts       # 22. Export client code
```

## Integration with Apps

### 1. Configure Vite Aliases

In `apps/[app]/vite.config.ts`:

```ts
resolve: {
  alias: {
    '@example/server': path.resolve(import.meta.dirname, '../../packages/example/src/server.ts'),
    '@example/database': path.resolve(import.meta.dirname, '../../packages/example/src/database.ts'),
  },
},
```

### 2. Register Migrations

In your app's migration script, import and register the package migrations:

```ts
import { ExampleMigrations } from "@example/database";

const AllMigrations = Layer.mergeAll(
  CoreMigrations,
  AuthMigrations,
  ExampleMigrations // Add package migrations
);
```

### 3. Register Seeds (Optional)

```ts
import { example } from "@example/database";

const seeders = [
  ...auth(),
  ...example({ features: 20 }), // Seed 20 features
];
```

### 4. Register Server Layers

In your app's server setup:

```ts
import { ExampleApiLive, ExampleRpcLive } from '@example/server';

// HTTP API
const AllApiRoutes = Layer.mergeAll(
  ExampleApiLive,
  // ...other routes
);

// RPC
const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
  Layer.provide(ExampleRpcLive),
);
```

### 5. Create Route Files

Create thin route files in your app that use the package's exports:

```tsx
// apps/[app]/src/routes/example/index.tsx
import { FeaturesPage, loadFeatures } from "@example";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/example/")({
  loader: () => loadFeatures(),
  component: FeaturesPageWrapper,
});

function FeaturesPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <FeaturesPage loaderData={loaderData} />;
}
```

## Key Concepts

### Server Functions

Server functions use `createServerFn` from TanStack Start for SSR data loading:

```ts
export const loadFeatures = createServerFn({ method: "GET" }).handler(
  async () => {
    const exit = await ExampleServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* FeatureService;
        return yield* service.list();
      })
    );
    return dehydrate(featuresAtom.remote, Result.fromExit(exit));
  }
);
```

### Hydration Pattern

The package uses Effect Atom for SSR hydration:

1. Server function returns `DehydratedAtom`
2. Route passes it to page component
3. Page wraps content in `HydrationBoundary`
4. Client atoms rehydrate automatically

### Effect Services

All business logic uses Effect's service pattern:

```ts
export class FeatureService extends Effect.Service<FeatureService>()(
  "FeatureService",
  {
    dependencies: [FeatureRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* FeatureRepository;
      return { list: () => repo.list() /* ... */ };
    }),
  }
) {}
```

## Exports

### Client Entry (`@example` or `./src/index.ts`)

- Schemas, types, error classes
- RPC definitions
- Atoms
- Page components
- Server functions (for route loaders)

### Server Entry (`@example/server` or `./src/server.ts`)

- Services
- RPC handlers (Live layers)
- HTTP API handlers (Live layers)
- Server runtime

### Database Entry (`@example/database` or `./src/database.ts`)

- Migrations
- Seeders
- Cleanup functions

## Conventions

1. **File Extensions**: Use `.js` in imports within the package (TypeScript resolution)
2. **Barrel Exports**: Each directory has an `index.ts` that re-exports
3. **Effect Services**: Use `Effect.Service` for dependency injection
4. **Schema-First**: Define schemas before repositories/services
5. **Typed Errors**: Use `S.TaggedError` for domain errors
6. **SSR-Ready**: All data loading goes through server functions

## See Also

- `src/database/README.md` - Database layer details
- `src/features/feature/domain/README.md` - Domain layer details
- `src/features/feature/server/README.md` - Server layer details
- `src/features/feature/client/README.md` - Client layer details
