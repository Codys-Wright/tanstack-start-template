# Auth Domain Schemas

**Complete Effect Schema system for Better Auth integration**

This directory contains a comprehensive, type-safe schema implementation for Better Auth that provides:

1. **1:1 mapping** with Better Auth's OpenAPI specification
2. **Faker.js integration** via Effect Schema's `arbitrary` annotations for test data generation
3. **Type-safe validation** for all auth operations
4. **Database seeding** capability using Effect Schema Arbitrary

## Architecture

```
domain/
├── auth.schema.ts              # Sign in/up/out flows
├── user.schema.ts              # User entities (with admin plugin)
├── session.schema.ts           # Session entities (with org/team context)
├── account.schema.ts           # Linked accounts & verification
├── organization.schema.ts      # Organization entities
├── organization-role.schema.ts # Dynamic roles (access control)
├── team.schema.ts              # Team entities
├── member.schema.ts            # Organization members
├── team-member.schema.ts       # Team membership
├── invitation.schema.ts        # Organization invitations
├── security.schema.ts          # Passkeys, 2FA, sessions
├── auth.context.ts             # Auth context for RPC
└── index.ts                    # Public API exports
```

## Schema Patterns

### 1. **Entity Classes** (with Schema.Class)

Used for database entities that have an identity:

```typescript
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String,
  name: Schema.String,
  createdAt: Schema.DateTimeUtc,
  // ...
}) {}
```

**When to use:**

- Database entities (User, Organization, Team, etc.)
- Entities with a unique identifier
- Objects that need instanceof checks

### 2. **Branded Types** (for IDs)

Used for type-safe identifiers:

```typescript
export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
```

**When to use:**

- All ID fields to prevent mixing different entity IDs
- Type-level guarantees (can't pass OrganizationId where UserId is expected)

### 3. **Payload Classes** (for API inputs)

Used for request payloads with faker annotations:

```typescript
export class CreateUserPayload extends Schema.Class<CreateUserPayload>(
  "CreateUserPayload"
)({
  name: Schema.String.pipe(Schema.nonEmptyString()).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.person.fullName()),
  }),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ).annotations({
    arbitrary: () => (fc: any) =>
      fc.constant(null).map(() => faker.internet.email()),
  }),
}) {}
```

**When to use:**

- API request payloads
- Forms and user input
- Anywhere you need test data generation

### 4. **Literal Unions** (for enums)

Used for fixed sets of values:

```typescript
export const OrganizationRole = Schema.Literal("owner", "admin", "member");
export type OrganizationRole = typeof OrganizationRole.Type;
```

**When to use:**

- Status fields (pending, accepted, rejected)
- Role types
- Any field with a fixed set of valid values

## Plugin Support

Our schemas include fields from Better Auth plugins:

### Admin Plugin

- `User.role`: User's global role
- `User.banned`: Ban status
- `User.banReason`, `User.banExpires`: Ban details
- `Session.impersonatedBy`: Admin impersonation tracking

### Organization Plugin

- `Organization`, `Member`, `Invitation` entities
- `Session.activeOrganizationId`: Current org context
- Organization roles and permissions

### Team Plugin (within Organizations)

- `Team`, `TeamMember` entities
- `Session.activeTeamId`: Current team context
- Team-based access control

### Passkey Plugin

- `Passkey` entity for WebAuthn credentials
- Passkey management schemas

### Two-Factor Plugin

- `TwoFactorStatus` for 2FA state
- TOTP and backup code schemas

## Using Schemas

### Validation

```typescript
import { Schema } from "effect";
import { CreateUserPayload } from "@/features/auth/domain";

// Decode (validate) user input
const result = Schema.decodeUnknownSync(CreateUserPayload)({
  name: "Alice",
  email: "alice@example.com",
  password: "secure123",
});

// Encode (serialize) for API
const encoded = Schema.encodeSync(CreateUserPayload)(payload);
```

### Generating Test Data

```typescript
import { Arbitrary } from "effect/Schema";
import * as FastCheck from "fast-check";
import { CreateUserPayload } from "@/features/auth/domain";

// Generate a single user
const userArb = Arbitrary.make(CreateUserPayload);
const user = FastCheck.sample(userArb, 1)[0];

// Generate 100 users
const users = FastCheck.sample(userArb, 100);
```

### Type Extraction

```typescript
import { User, CreateUserPayload } from "@/features/auth/domain";

// Extract TypeScript type from schema
type UserType = typeof User.Type;

// Use in function signatures
function createUser(payload: typeof CreateUserPayload.Type): Promise<User> {
  // ...
}
```

## Database Seeding

See `src/features/auth/database/seed.ts` for the complete seeding implementation.

**Example:**

```typescript
import { seedDatabase } from "@/features/auth/database/seed";

// Seed with defaults
await seedDatabase({
  users: 50,
  orgsPerUser: 2,
  membersPerOrg: 5,
  teamsPerOrg: 3,
});
```

## Schema Organization

### Core Auth Flows

- `auth.schema.ts`: Sign in/up/out, password reset, email change
- `session.schema.ts`: Session entity with org/team context
- `user.schema.ts`: User entity with admin plugin fields

### Social Login & Verification

- `account.schema.ts`: Linked accounts (Google, GitHub, etc.) and email verification

### Organizations & Teams

- `organization.schema.ts`: Organization CRUD operations
- `organization-role.schema.ts`: Dynamic role-based access control
- `team.schema.ts`: Team CRUD operations
- `member.schema.ts`: Organization membership
- `team-member.schema.ts`: Team membership
- `invitation.schema.ts`: Organization invitations

### Security Features

- `security.schema.ts`: Passkeys, 2FA, active sessions

## Faker.js Integration

All payload schemas include `arbitrary` annotations for generating realistic test data:

```typescript
name: Schema.String.annotations({
  arbitrary: () => (fc: any) => fc.constant(null).map(() =>
    faker.person.fullName()
  ),
}),

email: Schema.String.annotations({
  arbitrary: () => (fc: any) => fc.constant(null).map(() =>
    faker.internet.email()
  ),
}),

logo: Schema.NullOr(Schema.String).annotations({
  arbitrary: () => (fc: any) => fc.constant(null).map(() =>
    faker.image.url()
  ),
}),
```

**Available Faker Modules:**

- `faker.person.*`: Names, titles, bios
- `faker.internet.*`: Emails, URLs, usernames
- `faker.company.*`: Company names, descriptions
- `faker.image.*`: Logo and avatar URLs
- `faker.date.*`: Dates and timestamps
- `faker.datatype.*`: Booleans, numbers, UUIDs

See [@faker-js/faker docs](https://fakerjs.dev/) for full API.

## Effect Schema Benefits

1. **Compile-time Type Safety**

   - TypeScript types derived from schemas
   - No type/runtime mismatch

2. **Runtime Validation**

   - Parse untrusted input (API responses, user forms)
   - Fail fast with detailed error messages

3. **Transformations**

   - Convert between domain types and API types
   - Handle legacy formats

4. **Test Data Generation**

   - Generate realistic test data with Faker
   - Property-based testing with fast-check

5. **Self-Documenting**
   - Schemas serve as source of truth
   - API contracts embedded in code

## Migration from Old Schemas

The old auth schemas used plain `Schema.Struct` without `Schema.Class`. The new schemas:

1. Use `Schema.Class` for better instanceof checks and nominal typing
2. Include `arbitrary` annotations for all payload types
3. Match Better Auth OpenAPI spec 1:1
4. Support all Better Auth plugins out of the box

**Before:**

```typescript
export const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  // ...
});
```

**After:**

```typescript
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String,
  // ...
}) {}
```

## Best Practices

1. **Always use branded IDs** - Never use plain strings for entity IDs
2. **Add arbitrary annotations** - Every payload class should generate test data
3. **Match Better Auth** - Keep schemas aligned with Better Auth's types
4. **Validate at boundaries** - Decode user input, encode for APIs
5. **Use Schema.Class for entities** - Reserve Schema.Struct for simple value objects

## Further Reading

- [Effect Schema Docs](https://effect.website/docs/schema/introduction)
- [Better Auth Docs](https://www.better-auth.com/)
- [Better Auth OpenAPI Spec](../../reference/better-auth-openapi.json)
- [Faker.js Docs](https://fakerjs.dev/)
