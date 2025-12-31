# Auth Services Architecture Plan

## Overview

Refactor the auth package to use **Effect Services for server-side logic** and **Atoms for client-side reactivity**, removing the HTTP API wrapper layer. Better Auth remains the underlying auth engine, accessed directly through services and the auth client.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  Atoms (reactive state)          │  authClient (Better Auth)    │
│  - sessionAtom                   │  - signIn.email()            │
│  - signInAtom                    │  - signIn.social()           │
│  - signUpAtom                    │  - signIn.anonymous()        │
│  - organizationAtom              │  - organization.create()     │
│  - etc.                          │  - admin.banUser()           │
│                                  │  - etc.                      │
│  Atoms call authClient directly  │                              │
│  and validate with Effect Schema │                              │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP (cookies)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  Better Auth Handler             │  Effect Services             │
│  /api/auth/* (mounted directly)  │  - SessionService            │
│                                  │  - UserService               │
│  Handles all auth HTTP routes    │  - AdminService              │
│  directly from authClient calls  │  - OrganizationService       │
│                                  │  - TeamService               │
│                                  │  - MemberService             │
│                                  │  - InvitationService         │
│                                  │  - SecurityService           │
│                                  │                              │
│                                  │  Services wrap auth.api.*    │
│                                  │  for use in Effect handlers  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ depends on
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CORE AUTH SERVICE                          │
├─────────────────────────────────────────────────────────────────┤
│  AuthService                                                     │
│  - Holds the Better Auth instance (auth.api.*)                  │
│  - Helper methods: currentUserId(), getSession                  │
│  - Used by all feature services                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Design Decisions

### 1. Schema Validation

- **Keep all Effect Schemas** for input/output validation
- Atoms validate input with schemas before calling authClient
- Services validate input with schemas before calling auth.api

### 2. Request Headers

- Services accept optional `headers` parameter
- If not provided, services use `HttpServerRequest` from Effect context
- This allows services to work in both HTTP handler context and standalone

### 3. Error Handling

- Services return typed Effect errors (AuthError, Unauthenticated, etc.)
- Atoms handle errors and expose them reactively

### 4. HTTP API

- **Remove for now** - not needed since atoms call authClient directly
- Can be added later if external API access is needed

## File Structure

```
packages/auth/src/
├── core/
│   ├── config.ts              # AuthConfig (env vars)
│   ├── database.ts            # AuthDatabase (Kysely)
│   └── server/
│       ├── service.ts         # AuthService (Better Auth instance)
│       └── middleware.ts      # HttpAuthenticationMiddleware
│
├── features/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── schema.ts      # User, UserId schemas
│   │   │   └── index.ts
│   │   ├── server/
│   │   │   ├── service.ts     # UserService (Effect)
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── session/
│   │   ├── domain/
│   │   │   ├── schema.ts      # Session, SignIn/Up schemas
│   │   │   └── index.ts
│   │   ├── server/
│   │   │   ├── service.ts     # SessionService (Effect)
│   │   │   └── index.ts
│   │   ├── client/
│   │   │   ├── atoms.ts       # Session atoms
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── admin/
│   │   ├── domain/
│   │   │   └── schema.ts      # Admin operation schemas
│   │   ├── server/
│   │   │   └── service.ts     # AdminService (Effect)
│   │   └── client/
│   │       └── atoms.ts       # Admin atoms (if needed)
│   │
│   ├── organization/
│   │   ├── domain/
│   │   │   └── schema.ts      # Organization schemas
│   │   ├── server/
│   │   │   └── service.ts     # OrganizationService (Effect)
│   │   └── client/
│   │       └── atoms.ts       # Organization atoms
│   │
│   ├── team/
│   │   ├── domain/
│   │   │   └── schema.ts
│   │   ├── server/
│   │   │   └── service.ts     # TeamService (Effect)
│   │   └── client/
│   │       └── atoms.ts
│   │
│   ├── member/
│   │   ├── domain/
│   │   │   └── schema.ts
│   │   ├── server/
│   │   │   └── service.ts     # MemberService (Effect)
│   │   └── client/
│   │       └── atoms.ts
│   │
│   ├── invitation/
│   │   ├── domain/
│   │   │   └── schema.ts
│   │   ├── server/
│   │   │   └── service.ts     # InvitationService (Effect)
│   │   └── client/
│   │       └── atoms.ts
│   │
│   └── security/
│       ├── domain/
│       │   └── schema.ts      # 2FA, passkey, session schemas
│       ├── server/
│       │   └── service.ts     # SecurityService (Effect)
│       └── client/
│           └── atoms.ts
│
├── index.ts                   # Public exports (client-safe)
└── server.ts                  # Server exports (services, middleware)
```

## Implementation Order

### Phase 1: User Feature

1. Review existing `packages/auth/src/features/user/` structure
2. Keep/update `domain/schema.ts` with User, UserId schemas
3. Create `server/service.ts` with UserService
4. Update exports

### Phase 2: Session Feature

1. Keep `domain/schema.ts` with all session schemas
2. Create `server/service.ts` with SessionService
3. Update `client/atoms.ts` to use schemas for validation
4. Update exports

### Phase 3: Admin Feature

1. Keep `domain/schema.ts`
2. Create `server/service.ts` with AdminService
3. Create `client/atoms.ts` if needed for admin UI
4. Update exports

### Phase 4: Organization Feature

1. Keep `domain/schema.ts`
2. Create `server/service.ts` with OrganizationService
3. Update `client/atoms.ts` to use schemas
4. Update exports

### Phase 5: Team, Member, Invitation Features

1. Same pattern for each
2. Services + atoms + schemas

### Phase 6: Security Feature

1. Keep `domain/schema.ts` for 2FA, passkey, session management
2. Create `server/service.ts` with SecurityService
3. Create `client/atoms.ts` for security settings UI

### Phase 7: Cleanup

1. Remove HTTP API code (`AuthApi`, `*-api-live.ts` files)
2. Remove `auth-types.ts` (no longer needed)
3. Update `server.ts` and `index.ts` exports
4. Verify all imports work

## Service Pattern

Each service follows this pattern:

```typescript
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { AuthService } from "@auth/core/server/service";
import { AuthError, toAuthError } from "@auth/features/session/domain/schema";
import { SomeInput, SomeOutput } from "./schema";

export class SomeFeatureService extends Effect.Service<SomeFeatureService>()(
  "SomeFeatureService",
  {
    effect: Effect.gen(function* () {
      const auth = yield* AuthService;

      return {
        someMethod: (input: typeof SomeInput.Type) =>
          Effect.gen(function* () {
            // Validate input with schema
            const validated = yield* Schema.decodeUnknown(SomeInput)(input);

            // Call Better Auth API
            const response = yield* Effect.tryPromise({
              try: () => auth.api.someMethod({ body: validated }),
              catch: toAuthError,
            });

            // Validate/decode output
            return yield* Schema.decodeUnknown(SomeOutput)(response);
          }),
      };
    }),
    dependencies: [AuthService.Default],
  }
) {}
```

## Atom Pattern

Each atom follows this pattern:

```typescript
import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import * as Schema from "effect/Schema";
import { authClient } from "@auth/core/client/client";
import { SomeInput } from "../domain/schema";

export const someActionAtom = atom(null, async (get, set, input: unknown) => {
  // Validate input with schema
  const validated = Schema.decodeUnknownSync(SomeInput)(input);

  // Call authClient
  const result = await authClient.someMethod(validated);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
});
```

## Testing Strategy

### Server-Side (Services)

- Mock `AuthService` to provide fake Better Auth responses
- Test service logic in isolation
- No need to run actual Better Auth

### Client-Side (Atoms)

- Mock `authClient` methods
- Test atom state transitions
- Use jotai testing utilities

## Migration Notes

- Existing code using atoms continues to work (atoms still call authClient)
- Server code using `AuthService.currentUserId()` continues to work
- HTTP API endpoints (`/effect-auth/*`) will be removed
- Direct Better Auth routes (`/api/auth/*`) remain unchanged
