# Better Auth + Effect Integration

Complete integration of Better Auth with Effect services, RPC, and React atoms.

## Architecture Overview

### 1. Better Auth (Direct Client Access)
- **Location**: `src/features/auth/auth.ts`
- **Purpose**: Standalone authentication via Better Auth
- **Usage**: Direct API calls for sign-up, sign-in, sign-out
- **React Hook**: `useSession()` from Better Auth client

### 2. Effect Auth Service (Server-Side)
- **Location**: `src/features/auth/effect/auth-service.ts`
- **Purpose**: Domain-level auth abstraction for Effect services
- **Key Feature**: **No requirement leakage** - HttpServerRequest is accessed internally
- **Usage**: Use in any Effect service to check authentication

### 3. Auth RPC (Effect Integration)
- **Location**: `src/features/auth/domain/auth-rpc.ts` + `src/features/auth/server/auth-rpc-live.ts`
- **Purpose**: Expose auth operations via RPC
- **Endpoints**:
  - `auth_getCurrentUser` - Returns `Option<User>`

### 4. Auth Atoms (React Client State)
- **Location**: `src/features/auth/client/auth-atoms.tsx`
- **Purpose**: React state management with Effect RPC
- **Atoms**:
  - `currentUserAtom` - Full user data via RPC
  - `isAuthenticatedAtom` - Boolean auth status
  - `userOrUndefinedAtom` - User or undefined

## File Structure

```
src/features/auth/
├── auth.ts                          # Better Auth instance
├── lib.ts                           # Better Auth config options
├── policy.ts                        # CurrentUser context tag
├── client/
│   ├── auth-client.ts               # Better Auth React client
│   └── auth-atoms.tsx               # Effect atoms for auth state
├── domain/
│   └── auth-rpc.ts                  # Auth RPC definitions
├── effect/
│   ├── auth-schema.ts               # Effect schemas (User, Session, etc.)
│   ├── auth-service.ts              # AuthService (NO requirement leakage!)
│   ├── auth-middleware-live.ts     # RPC middleware providing CurrentUser
│   └── better-auth-client.ts       # Internal Better Auth wrapper
└── server/
    └── auth-rpc-live.ts            # Live implementation of Auth RPC
```

## Usage Examples

### 1. Better Auth Client (Direct)

```tsx
import { authClient, useSession } from "@/features/auth/client";

function MyComponent() {
  const { data: session } = useSession();

  const handleSignIn = async () => {
    await authClient.signIn.email({
      email: "user@example.com",
      password: "password123",
    });
  };

  return session?.user ? (
    <div>Hello, {session.user.name}</div>
  ) : (
    <button onClick={handleSignIn}>Sign In</button>
  );
}
```

### 2. Effect Atoms (RPC-based)

```tsx
import { useAtomValue, useAtomRefresh } from "@effect-atom/atom-react";
import { Result } from "@effect-atom/atom-react";
import { currentUserAtom } from "@/features/auth/client";

function MyComponent() {
  const userResult = useAtomValue(currentUserAtom);
  const refreshUser = useAtomRefresh(currentUserAtom);

  if (!Result.isSuccess(userResult)) {
    return <div>Loading...</div>;
  }

  const userOption = userResult.value;
  if (userOption._tag === "None") {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <p>Hello, {userOption.value.name}</p>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
}
```

### 3. AuthService in Effect Services

```ts
import { AuthService } from "@/features/auth/effect";
import * as Effect from "effect/Effect";

class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    const doSomething = Effect.gen(function* () {
      // Require authentication - fails with AuthenticationError if not logged in
      const user = yield* auth.requireUser;
      
      console.log(`Doing something for user: ${user.name}`);
      
      return { success: true };
    });

    return { doSomething } as const;
  }),
}) {}

export const MyServiceLive = MyService.Default.pipe(
  Layer.provide(AuthService.layer)
);
```

### 4. Using CurrentUser in RPC Handlers

```ts
import { CurrentUser } from "@/features/auth/policy";
import * as Effect from "effect/Effect";

export const MyRpcLive = MyRpc.toLayer(
  Effect.gen(function* () {
    return {
      // This RPC handler has access to CurrentUser
      // provided by CurrentUserRpcMiddleware
      myRpc_doSomething: () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser;
          
          console.log(`User ${currentUser.userId} called this RPC`);
          
          return { success: true };
        }),
    };
  }),
);
```

## Key Design Decisions

### 1. Preventing Server Code from Leaking to Client

**CRITICAL**: The auth barrel exports (`src/features/auth/index.ts` and `src/features/auth/effect/index.ts`) must NOT export any code that directly or indirectly imports server-side dependencies like `pg`, `Pool`, etc.

**The Problem Chain**:
```
Client Code
  → imports DomainRpc
    → merges AuthRpc  
      → imports from auth barrel
        → exports from effect/index.js
          → exports CurrentUserRpcMiddlewareLive (❌ DON'T DO THIS)
            → imports BetterAuthClient
              → imports auth from "../auth.js"
                → imports pg from "pg" 💥 BREAKS IN BROWSER
```

**The Solution**:
- ✅ **DO** export schemas, types, and service interfaces (they have no server deps)
- ❌ **DON'T** export live implementations, middleware, or anything importing Better Auth
- 📁 Import server implementations directly with explicit paths in server code

**Safe Exports** (auth/effect/index.ts):
```ts
export * from "./auth-schema.js";  // ✅ Pure schemas
export { AuthService } from "./auth-service.js";  // ✅ Service interface only
```

**Unsafe Exports** (DON'T DO THIS):
```ts
export { CurrentUserRpcMiddlewareLive } from "./auth-middleware-live.js";  // ❌ Imports BetterAuthClient
export { BetterAuthClient } from "./better-auth-client.js";  // ❌ Imports auth.js
export { auth } from "./auth.js";  // ❌ Imports pg
```

**Server Code Must Import Directly**:
```ts
// ✅ Correct - explicit imports
import { CurrentUserRpcMiddlewareLive } from "@/features/auth/effect/auth-middleware-live.js";
import { AuthService } from "@/features/auth/effect/auth-service.js";

// ❌ Wrong - would pull in server deps if they were in barrel
import { CurrentUserRpcMiddlewareLive } from "@/features/auth/effect";
```

### 2. No Requirement Leakage in AuthService

**Problem**: If AuthService methods expose `HttpServerRequest` in their type signature, it leaks implementation details and makes the service hard to test.

**Solution**: 
- Service interface has `Effect<Success, Error, never>` (no requirements)
- Methods access `HttpServerRequest` internally when invoked
- Type assertions ensure the interface doesn't leak requirements
- RPC/HTTP runtime provides `HttpServerRequest` per-request

```ts
// ✅ Good - No requirement leakage
interface AuthServiceImpl {
  readonly getCurrentUser: Effect.Effect<Option.Option<User>, never, never>;
}

// ❌ Bad - Leaks HttpServerRequest requirement
interface AuthServiceImpl {
  readonly getCurrentUser: Effect.Effect<
    Option.Option<User>,
    never,
    HttpServerRequest.HttpServerRequest
  >;
}
```

### 2. Two-Layer Auth Architecture

**Better Auth Client** (React/Browser):
- Direct authentication operations (sign-up, sign-in, sign-out)
- Session management via cookies
- React hooks for UI integration

**Effect Auth Service** (Server/RPC):
- Domain-level auth abstraction
- Used by Effect services and RPC handlers
- Validates sessions on each request
- Provides typed user context

### 3. Atoms Follow Todo Pattern

Auth atoms use the same pattern as todo atoms:
- Remote atom for RPC data fetching
- Object.assign to expose `.remote` property
- `useAtomRefresh()` hook for refreshing
- Serializable to localStorage

## Testing

### Testing AuthService

```ts
import { AuthService } from "@/features/auth/effect";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";

const mockUser: User = {
  id: "test-user-id" as UserId,
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  createdAt: DateTime.unsafeMake(Date.now()),
  updatedAt: DateTime.unsafeMake(Date.now()),
};

const testLayer = AuthService.testLayer(mockUser);

const myTest = Effect.gen(function* () {
  const auth = yield* AuthService;
  const user = yield* auth.requireUser;
  
  assert.equal(user.name, "Test User");
});

await Effect.runPromise(
  myTest.pipe(Effect.provide(testLayer))
);
```

## Routes

- `/auth-test` - Interactive test page demonstrating:
  - Better Auth client (sign-up, sign-in, sign-out)
  - Effect atoms (RPC-based auth state)
  - Side-by-side comparison

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/your-database

# Better Auth
BETTER_AUTH_SECRET=<generated-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Running the App

```bash
# Start PostgreSQL (on port 5433)
docker compose up -d

# Run Better Auth migration
pnpm auth:migrate

# Start dev server
pnpm dev

# Visit http://localhost:3000/auth-test
```

## Next Steps

Potential enhancements:
- [ ] Add permission/authorization service
- [ ] Session caching to reduce Better Auth calls
- [ ] More RPC endpoints (update profile, change password, etc.)
- [ ] Passkey integration on client
- [ ] Email verification flow
- [ ] Password reset flow
