# Auth Database

This folder contains authentication-related database migrations and schema.

## Better Auth Schema Management

Better Auth manages its own schema automatically. The schema includes:

- **user** - User accounts (managed by Better Auth)
- **session** - Active user sessions
- **account** - OAuth provider accounts and password authentication
- **verification** - Email verification and password reset tokens

### Generated Schema

The Better Auth schema is auto-generated and stored in `better-auth-schema.sql` for reference.

**To regenerate the schema:**

```bash
# Reset database (drops all tables)
bun run db:reset

# Generate Better Auth schema SQL file
bun run auth:generate
```

This outputs the schema to `./migrations/better-auth-schema.sql`.

**Schema file location:** `migrations/better-auth-schema.sql`

**Why generate?**
- Review Better Auth's table structure
- Manual migration control if needed
- Documentation of auth schema
- Ability to customize before applying

### Runtime Auto-Migration

By default, Better Auth auto-migrates on app startup via `better-auth.service.ts`:

```typescript
const { runMigrations } = yield* Effect.promise(() =>
  getMigrations(options),
);
yield* Effect.promise(runMigrations);
```

This ensures the schema is always up-to-date when the app starts.

### Configuration

The Better Auth configuration is shared between runtime and CLI:

- **Service**: `server/better-auth.service.ts` 
  - Exports `makeBetterAuthOptions()` function
  - Effect-integrated for runtime
  
- **CLI**: `../auth.ts`
  - Imports `makeBetterAuthOptions()`
  - Same config ensures consistency

Both use identical settings for:
- Email/password authentication
- OpenAPI plugin
- PostgreSQL with Kysely
- Camel case column naming

## Custom Migrations

### Users Table (Legacy)

File: `0001_users_table.ts`

**Note:** This creates a `users` table, but Better Auth creates a `user` table (singular). Consider removing this migration and using Better Auth's user table instead.

### Static Test User

File: `0002_static_user.ts`

Inserts a static user for development/testing:
- ID: `00000000-0000-0000-0000-000000000001`
- Email: `static@example.com`

**Note:** Ensure this references the correct user table (`user` vs `users`).

## Migration Order

Auth migrations run first in the global migration order:

```
0001_auth_users_table
0002_auth_static_user
0003_todo_todos_table  (references user.id)
```

## Schema Reference

Better Auth's generated schema (in `better-auth-schema.sql`):

```sql
-- User accounts
CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL,
  "image" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  -- ... other fields
);

-- Accounts (OAuth + password)
CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "password" TEXT,  -- For email/password auth
  -- ... other fields
);

-- Verification tokens
CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL
);
```

## Commands

```bash
# Generate Better Auth schema SQL
bun run auth:generate

# Run Better Auth migrations (auto-migration)
bun run auth:migrate

# Run all feature migrations
bun run db:migrate

# Reset database
bun run db:reset
```
