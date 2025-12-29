# Client Layer

The client layer contains everything needed for the browser/React side: RPC client setup, reactive atoms with SSR support, UI components, views, and pages.

## Directory Structure

```
client/
├── client.ts              # RPC client setup (AtomRpc.Tag)
├── atoms.ts               # Reactive atoms with SSR hydration
├── presentation/
│   ├── components/        # Reusable UI components
│   │   ├── feature-card.tsx
│   │   └── index.ts
│   ├── views/             # Composed views (stateful components)
│   │   ├── features-list.tsx
│   │   └── index.ts
│   └── routes/            # Page components + server functions
│       ├── features-page.tsx
│       ├── load-features.ts
│       ├── feature-detail-page.tsx
│       ├── load-feature-by-id.ts
│       └── index.ts
└── index.ts               # Public exports
```

## File Creation Order

1. **client.ts** - RPC client setup
2. **atoms.ts** - Reactive state atoms
3. **presentation/components/** - Stateless UI components
4. **presentation/views/** - Stateful composed views
5. **presentation/routes/** - Page components + server functions
6. **index.ts** - Public exports

## client.ts - RPC Client Setup

The RPC client provides typed access to server methods.

```ts
import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { FeatureRpc } from '../domain/index.js';

export class FeatureClient extends AtomRpc.Tag<FeatureClient>()('@example/FeatureClient', {
  group: FeatureRpc,          // RPC group from domain
  protocol: RpcProtocol,       // Shared protocol config
}) {}
```

### What FeatureClient Provides

- **`FeatureClient.query()`** - Create query atoms
- **`FeatureClient.mutation()`** - Create mutation atoms
- **`FeatureClient.runtime`** - Effect runtime for custom atoms
- **`FeatureClient.layer`** - Layer for Effect services
- **`FeatureClient`** - Context Tag to yield the raw client

## atoms.ts - Reactive State with SSR

Atoms provide reactive state management with SSR hydration support.

### Query Atom with SSR Support

```ts
import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { Feature } from '../domain/index.js';
import { FeatureClient } from './client.js';

const FeaturesSchema = Schema.Array(Feature);

export const featuresAtom = (() => {
  // Remote atom that fetches from RPC
  const remoteAtom = FeatureClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* FeatureClient;
        return yield* client('feature_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@example/features',  // Unique key for hydration
        schema: Result.Schema({
          success: FeaturesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: FeaturesCacheUpdate) => {
        // Handle local cache updates (optimistic UI)
        const current = ctx.get(featuresAtom);
        if (!Result.isSuccess(current)) return;
        
        // Apply update to cache
        ctx.setSelf(Result.success(updatedValue));
      },
      (refresh) => {
        refresh(remoteAtom);  // Re-fetch on refresh
      },
    ),
    { remote: remoteAtom },
  );
})();
```

### Key Concepts

1. **`serializable()`** - Makes atoms SSR-compatible
   - `key` - Unique identifier for hydration matching
   - `schema` - Effect Schema for serialization/deserialization

2. **`Result` type** - Represents async state:
   - `Result.Initial` - Not yet loaded
   - `Result.Success<A>` - Successfully loaded with value
   - `Result.Failure<E>` - Failed with error

3. **Writable atoms** - Support local cache updates for optimistic UI

### Mutation Atoms

```ts
export const createFeatureAtom = FeatureClient.runtime.fn<CreateFeatureInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* FeatureClient;
    const result = yield* client('feature_create', { input });
    
    // Update local cache after successful mutation
    get.set(featuresAtom, { _tag: 'Upsert', feature: result });
    
    return result;
  }),
);

export const deleteFeatureAtom = FeatureClient.runtime.fn<FeatureId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* FeatureClient;
    yield* client('feature_remove', { id });
    
    // Update local cache
    get.set(featuresAtom, { _tag: 'Delete', id });
  }),
);
```

### Using Atoms in Components

```tsx
import { useAtomValue, useAtomRefresh, Result } from '@effect-atom/atom-react';
import { featuresAtom, createFeatureAtom } from '../atoms';

function FeaturesList() {
  const result = useAtomValue(featuresAtom);
  const refresh = useAtomRefresh(featuresAtom);

  return Result.builder(result)
    .onInitial(() => <Loading />)
    .onSuccess((features) => <FeatureList features={features} />)
    .onFailure((error) => <Error error={error} onRetry={refresh} />)
    .render();
}
```

## Presentation Layer

### Components (Stateless)

Components are pure UI elements that receive data via props.

```tsx
// presentation/components/feature-card.tsx
import { Card } from '@shadcn';
import type { Feature } from '../../../domain/index.js';

export interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{feature.name}</Card.Title>
        <Card.Description>{feature.description}</Card.Description>
      </Card.Header>
    </Card>
  );
}
```

### Views (Stateful)

Views connect to atoms and compose components.

```tsx
// presentation/views/features-list.tsx
import { Alert, Button } from '@shadcn';
import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { featuresAtom } from '../../atoms.js';
import { FeatureCard } from '../components/index.js';

export function FeaturesListView() {
  const result = useAtomValue(featuresAtom);
  const refreshFeatures = useAtomRefresh(featuresAtom);

  return (
    <div>
      {Result.builder(result)
        .onInitial(() => <p>Loading features...</p>)
        .onSuccess((features) => (
          <div className="space-y-4">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        ))
        .onFailure((error) => (
          <Alert variant="destructive">
            <Alert.Title>Error loading features.</Alert.Title>
            <Alert.Description>
              <Button onClick={refreshFeatures}>Retry</Button>
            </Alert.Description>
          </Alert>
        ))
        .render()}
    </div>
  );
}
```

### Pages (Route Components)

Pages are the top-level components for routes. They handle SSR hydration.

```tsx
// presentation/routes/features-page.tsx
import type * as Hydration from '@effect-atom/atom/Hydration';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import { FeaturesListView } from '../views/index.js';

export interface FeaturesPageProps {
  loaderData: Hydration.DehydratedAtom;
}

export function FeaturesPage({ loaderData }: FeaturesPageProps) {
  return (
    <HydrationBoundary state={[loaderData]}>
      <main className="container mx-auto p-4 md:p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Features</h1>
          <FeaturesListView />
        </div>
      </main>
    </HydrationBoundary>
  );
}
```

## Server Functions (TanStack Start)

Server functions run on the server and return data for SSR.

### List Loader (with Atom Hydration)

```ts
// presentation/routes/load-features.ts
import type * as Hydration from '@effect-atom/atom/Hydration';
import { Atom, Result } from '@effect-atom/atom-react';
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';

import { AuthService } from '@auth/server';
import { ExampleServerRuntime } from '../../../../../core/server/runtime.js';
import { FeatureService } from '../../../server/index.js';
import { featuresAtom } from '../../atoms.js';

// Dehydrate helper for SSR
const dehydrate = <A, I>(
  atom: Atom.Atom<A> & { [Atom.SerializableTypeId]: { key: string; encode: (value: A) => I } },
  value: A,
): Hydration.DehydratedAtom =>
  ({
    '~@effect-atom/atom/DehydratedAtom': true,
    key: atom[Atom.SerializableTypeId].key,
    value: atom[Atom.SerializableTypeId].encode(value),
    dehydratedAt: Date.now(),
  }) as Hydration.DehydratedAtom;

export const loadFeatures = createServerFn({ method: 'GET' }).handler(async () => {
  const featuresExit = await ExampleServerRuntime.runPromiseExit(
    Effect.gen(function* () {
      const service = yield* FeatureService;
      return yield* service.list();
    }),
  );

  // Dehydrate for HydrationBoundary
  return dehydrate(featuresAtom.remote, Result.fromExit(featuresExit));
});
```

### Detail Loader (Simple Return)

For simpler cases without atom hydration:

```ts
// presentation/routes/load-feature-by-id.ts
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { ExampleServerRuntime } from '../../../../../core/server/runtime.js';
import type { Feature } from '../../../domain/index.js';
import { FeatureService } from '../../../server/index.js';

export interface FeatureDetailLoaderData {
  feature: Feature | null;
  error: string | null;
}

export const loadFeatureById = createServerFn({ method: 'GET' }).handler(
  async (ctx: { data: string }): Promise<FeatureDetailLoaderData> => {
    const featureId = ctx.data;

    const exit = await ExampleServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* FeatureService;
        return yield* service.getById(featureId as any);
      }),
    );

    if (Exit.isSuccess(exit)) {
      return { feature: exit.value, error: null };
    }

    return { feature: null, error: 'Feature not found' };
  },
);
```

## App Integration

Apps wire up the exported pages and loaders in their route files:

```tsx
// apps/my-app/src/routes/example/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { FeaturesPage, loadFeatures } from '@example';

export const Route = createFileRoute('/example/')({
  loader: () => loadFeatures(),
  component: FeaturesPageWrapper,
});

function FeaturesPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <FeaturesPage loaderData={loaderData} />;
}
```

```tsx
// apps/my-app/src/routes/example/$featureId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { FeatureDetailPage, loadFeatureById } from '@example';

export const Route = createFileRoute('/example/$featureId')({
  loader: ({ params }) => loadFeatureById({ data: params.featureId }),
  component: FeatureDetailPageWrapper,
});

function FeatureDetailPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <FeatureDetailPage loaderData={loaderData} />;
}
```

## index.ts - Public Exports

```ts
// Re-export client
export * from './client';

// Re-export atoms
export * from './atoms';

// Re-export presentation
export * from './presentation/components';
export * from './presentation/views';
export * from './presentation/routes';
```

## Key Principles

1. **SSR-First** - All data loading supports server-side rendering
2. **Hydration Pattern** - Server dehydrates, client hydrates atoms
3. **Result Type** - Consistent async state handling
4. **Separation of Concerns** - Components, Views, Pages have distinct roles
5. **Type Safety** - End-to-end types from domain to UI
6. **Optimistic Updates** - Mutation atoms update cache immediately
