# Active Quiz Server Layer - Implementation Plan

## Overview

This directory needs server-side service and RPC handler implementations for the active-quiz feature. Active quizzes represent the "live" configuration that maps a slug to a specific quiz and analysis engine.

## Files to Create

### 1. `service.ts` - ActiveQuizServerService

```typescript
import * as Effect from "effect/Effect";
import { ActiveQuizRepo } from "../database/index.js";
import type { UpsertActiveQuizPayload } from "../domain/schema.js";

export class ActiveQuizServerService extends Effect.Service<ActiveQuizServerService>()(
  "ActiveQuizServerService",
  {
    dependencies: [ActiveQuizRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ActiveQuizRepo;

      return {
        /** List all active quizzes */
        list: () => repo.findAll(),

        /** Get active quiz by slug */
        getBySlug: (slug: string) => repo.findBySlug(slug),

        /** Upsert an active quiz */
        upsert: (input: UpsertActiveQuizPayload) =>
          Effect.gen(function* () {
            if (input.id !== undefined) {
              // Update existing
              return yield* repo.update({
                id: input.id,
                slug: input.slug,
                quizId: input.quizId,
                engineId: input.engineId,
              });
            }

            // Create new
            return yield* repo.create({
              slug: input.slug,
              quizId: input.quizId,
              engineId: input.engineId,
            });
          }),

        /** Delete an active quiz by slug */
        delete: (slug: string) => repo.deleteBySlug(slug),
      } as const;
    }),
  }
) {}
```

### 2. `rpc-live.ts` - ActiveQuizRpcLive

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ActiveQuizRpc } from "../domain/rpc.js";
import { ActiveQuizServerService } from "./service.js";

export const ActiveQuizRpcLive = ActiveQuizRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ActiveQuizServerService;

    return ActiveQuizRpc.of({
      active_quiz_list: Effect.fn(function* () {
        yield* Effect.log("[RPC] Listing active quizzes");
        return yield* service.list();
      }),

      active_quiz_getBySlug: Effect.fn(function* ({ slug }) {
        yield* Effect.log(`[RPC] Getting active quiz by slug: ${slug}`);
        return yield* service.getBySlug(slug);
      }),

      active_quiz_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log(`[RPC] Upserting active quiz`);
        return yield* service.upsert(input);
      }),

      active_quiz_delete: Effect.fn(function* ({ slug }) {
        yield* Effect.log(`[RPC] Deleting active quiz: ${slug}`);
        return yield* service.delete(slug);
      }),
    });
  })
).pipe(Layer.provide(ActiveQuizServerService.Default));
```

### 3. `index.ts` - Update Exports

```typescript
// Server: Services - requires server environment
export * from "./service.js";
export * from "./rpc-live.js";
```

## Integration Steps

### 1. Wire into Core Layer

Update `packages/quiz/src/core/server/layer.ts`:

```typescript
import { ActiveQuizRpcLive } from "../../features/active-quiz/server/index.js";

export const QuizRpcLive = Layer.mergeAll(
  QuizzesRpcLive,
  AnalysisRpcLive,
  AnalysisEngineRpcLive,
  ResponsesRpcLive,
  ActiveQuizRpcLive // Add this
);
```

### 2. Update Runtime (optional)

If the service needs to be available in the runtime, update `packages/quiz/src/core/server/runtime.ts`.

## RPC Method Reference

From `domain/rpc.ts`:

- `active_quiz_list` - List all active quizzes
- `active_quiz_getBySlug` - Get by slug (error: ActiveQuizNotFoundError)
- `active_quiz_upsert` - Create/update (error: ActiveQuizNotFoundError)
- `active_quiz_delete` - Delete by slug (error: ActiveQuizNotFoundError)

## Repo Methods Available

From `database/repo.ts`:

- `findAll()` - Get all active quizzes
- `findBySlug(slug)` - Get by slug (throws ActiveQuizNotFoundError)
- `create(input)` - Create new active quiz
- `update(input)` - Update existing active quiz
- `deleteBySlug(slug)` - Delete by slug (hard delete)

## Schema Reference

From `domain/schema.ts`:

```typescript
ActiveQuiz {
  id: ActiveQuizId
  slug: string        // URL-friendly identifier (e.g., "my-artist-type")
  quizId: QuizId      // Reference to the quiz
  engineId: AnalysisEngineId  // Reference to the analysis engine
  createdAt: DateTimeUtc
  updatedAt: DateTimeUtc
}

UpsertActiveQuizPayload {
  id?: ActiveQuizId   // Optional for create, required for update
  slug: string
  quizId: QuizId
  engineId: AnalysisEngineId
}
```

## Notes

- Active quizzes use **hard delete** (not soft delete) since they're configuration, not data
- The slug is the primary lookup key for public-facing quiz URLs
- Consider validating that the referenced quiz and engine exist during upsert
- The `QuizTakerService` in `domain/quiz-taker.service.ts` may already handle some of this logic - review before implementing to avoid duplication

## Relationship to QuizTakerService

The existing `QuizTakerService` at `domain/quiz-taker.service.ts` provides quiz-taking functionality. The server layer here is specifically for CRUD operations on the active quiz configuration. They serve different purposes:

- **ActiveQuizServerService**: Admin CRUD for active quiz configs
- **QuizTakerService**: Runtime service for taking quizzes (loads quiz, engine, handles responses)

Both may be needed in the final implementation.
