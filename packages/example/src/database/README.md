# Database Layer

The database layer handles schema migrations, data seeding, and provides the foundation for repositories.

## Structure

```
database/
├── migrations/
│   └── 0001_features_table.ts   # Individual migration files
├── migrations.ts                 # Migration discovery/registration
├── seeds.ts                      # Data seeders for dev/testing
└── index.ts                      # Exports
```

## Migrations

### Creating a Migration

Migrations are Effect programs that modify the database schema. Create a new file in `migrations/` with a numeric prefix:

```ts
// migrations/0001_features_table.ts
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create table
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.features (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      fake BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Create indexes
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_features_created_at 
    ON public.features (created_at DESC)
  `;
});
```

### Migration Naming Convention

```
NNNN_descriptive_name.ts
```

- `NNNN`: 4-digit sequence number (0001, 0002, etc.)
- `descriptive_name`: What the migration does (snake_case)

Examples:
- `0001_features_table.ts`
- `0002_add_status_column.ts`
- `0003_create_categories_table.ts`

### Registering Migrations

In `migrations.ts`, use `discoverFromPath` to auto-discover migrations:

```ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverFromPath } from '@core/database';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ExampleMigrations = discoverFromPath({
  path: join(__dirname, 'migrations'),
  prefix: 'example',  // Prefix for migration tracking table
});
```

The `prefix` ensures migrations from different packages don't conflict.

### Using Migrations in App

In your app's migration script:

```ts
import { ExampleMigrations } from '@example/database';
import { CoreMigrations, AuthMigrations } from '@core/database';
import { Layer } from 'effect';

const AllMigrations = Layer.mergeAll(
  CoreMigrations,
  AuthMigrations,
  ExampleMigrations,
);

// Run migrations
await Effect.runPromise(
  Migrator.run.pipe(
    Effect.provide(AllMigrations),
    Effect.provide(PgLive),
  )
);
```

## Seeds

### Creating a Seeder

Seeders create fake data for development and testing. Use `makeSeeder` from `@core/database`:

```ts
import { makeSeeder } from '@core/database';
import { faker } from '@faker-js/faker';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export const features = makeSeeder(
  { 
    name: 'features',      // Unique identifier
    defaultCount: 20,      // Default number to create
    dependsOn: [],         // Other seeders this depends on
  },
  (count) => Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    // Check existing fake data
    const existing = yield* sql<{ count: string }>`
      SELECT COUNT(*)::text as count FROM features WHERE fake = true
    `;
    const existingCount = Number(existing[0].count);

    if (existingCount >= count) {
      return { name: 'features', existing: existingCount, created: 0 };
    }

    const toCreate = count - existingCount;
    let created = 0;

    for (let i = 0; i < toCreate; i++) {
      yield* sql`
        INSERT INTO features (id, name, description, fake, created_at, updated_at)
        VALUES (
          gen_random_uuid(), 
          ${faker.company.buzzPhrase()}, 
          ${faker.lorem.sentence()}, 
          true,  -- Mark as fake for cleanup
          NOW(), 
          NOW()
        )
      `;
      created++;
    }

    return { name: 'features', existing: existingCount, created };
  })
);
```

### Key Seeder Patterns

1. **Mark fake data**: Add a `fake` boolean column to identify seeded data
2. **Idempotent**: Check existing count before creating
3. **Dependencies**: Use `dependsOn` for related data (e.g., users before posts)

### Composing Seeders

Create a composer function for easy use:

```ts
interface ExampleSeedOptions {
  readonly features?: number;
}

export const example = (options: ExampleSeedOptions = {}): ReadonlyArray<SeederEntry> => [
  features(options.features),
];
```

Usage in app:
```ts
import { example } from '@example/database';

const seeders = [
  ...auth(),
  ...example({ features: 50 }),  // Override default count
];
```

## Cleanup

### Creating Cleanup Functions

Cleanup functions remove fake/test data:

```ts
import { makeCleanup } from '@core/database';

export const cleanupFeatures = makeCleanup({
  name: 'features',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM features WHERE fake = true
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => 
    sql`DELETE FROM features WHERE fake = true`.pipe(Effect.asVoid),
});

export const exampleCleanup = (): ReadonlyArray<CleanupEntry> => [
  cleanupFeatures(),
];
```

## Best Practices

### Migrations

1. **Never modify existing migrations** in production - create new ones
2. **Use IF NOT EXISTS** for idempotent migrations
3. **Include rollback logic** if needed (though this template uses forward-only)
4. **Test migrations** on a fresh database before deploying
5. **Keep migrations focused** - one concern per migration

### Seeds

1. **Always mark fake data** with a boolean flag
2. **Make seeders idempotent** - safe to run multiple times
3. **Use realistic fake data** with @faker-js/faker
4. **Respect foreign keys** with `dependsOn`
5. **Don't seed in production** - use environment checks

### Schema Design

1. **Use UUID primary keys** for distributed systems
2. **Include timestamps** (`created_at`, `updated_at`)
3. **Add indexes** for frequently queried columns
4. **Use TIMESTAMPTZ** for timezone-aware timestamps

## Exports

The `database.ts` entry point exports:

```ts
// database.ts
export * from './database/index.js';

// database/index.ts
export { ExampleMigrations } from './migrations.js';
export { features, example, cleanupFeatures, exampleCleanup } from './seeds.js';
```
