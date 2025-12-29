# Responses Server Layer - Implementation Plan

## Overview

This directory needs server-side service and RPC handler implementations for the responses feature.

## Files to Create

### 1. `service.ts` - ResponsesServerService

```typescript
import * as Effect from "effect/Effect";
import { ResponsesRepo } from "../database/index.js";
import { QuizzesRepo } from "../../quiz/database/index.js";
import type { ResponseId, UpsertResponsePayload } from "../domain/schema.js";
import type { QuizId } from "../../quiz/domain/schema.js";
import { InvalidQuizError } from "../domain/schema.js";

export class ResponsesServerService extends Effect.Service<ResponsesServerService>()(
  "ResponsesServerService",
  {
    dependencies: [ResponsesRepo.Default, QuizzesRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ResponsesRepo;
      const quizzesRepo = yield* QuizzesRepo;

      return {
        /** List all responses */
        list: () => repo.findAll(),

        /** Get response by ID */
        getById: (id: ResponseId) => repo.findById(id),

        /** Get all responses for a quiz */
        getByQuiz: (quizId: QuizId) =>
          Effect.gen(function* () {
            // Validate quiz exists first
            yield* quizzesRepo
              .findById(quizId)
              .pipe(
                Effect.catchTag("QuizNotFoundError", () =>
                  Effect.fail(new InvalidQuizError({ quizId }))
                )
              );
            return yield* repo.findByQuizId(quizId);
          }),

        /** Upsert a response */
        upsert: (input: UpsertResponsePayload) =>
          Effect.gen(function* () {
            // Validate quiz exists
            yield* quizzesRepo
              .findById(input.quizId)
              .pipe(
                Effect.catchTag("QuizNotFoundError", () =>
                  Effect.fail(new InvalidQuizError({ quizId: input.quizId }))
                )
              );

            if (input.id !== undefined) {
              // Update existing
              return yield* repo.update({
                id: input.id,
                quizId: input.quizId,
                answers: input.answers,
                sessionMetadata: input.sessionMetadata,
                interactionLogs: input.interactionLogs,
                metadata: input.metadata,
              });
            }

            // Create new
            return yield* repo.create({
              quizId: input.quizId,
              answers: input.answers,
              sessionMetadata: input.sessionMetadata,
              interactionLogs: input.interactionLogs,
              metadata: input.metadata,
            });
          }),

        /** Delete a response (soft delete) */
        delete: (id: ResponseId) => repo.del(id),
      } as const;
    }),
  }
) {}
```

### 2. `rpc-live.ts` - ResponsesRpcLive

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ResponsesRpc } from "../domain/rpc.js";
import { ResponsesServerService } from "./service.js";

export const ResponsesRpcLive = ResponsesRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ResponsesServerService;

    return ResponsesRpc.of({
      response_list: Effect.fn(function* () {
        yield* Effect.log("[RPC] Listing responses");
        return yield* service.list();
      }),

      response_getById: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting response ${id}`);
        return yield* service.getById(id);
      }),

      response_getByQuiz: Effect.fn(function* ({ quizId }) {
        yield* Effect.log(`[RPC] Getting responses for quiz ${quizId}`);
        return yield* service.getByQuiz(quizId);
      }),

      response_upsert: Effect.fn(function* ({ input }) {
        yield* Effect.log("[RPC] Upserting response");
        return yield* service.upsert(input);
      }),

      response_delete: Effect.fn(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting response ${id}`);
        return yield* service.delete(id);
      }),
    });
  })
).pipe(Layer.provide(ResponsesServerService.Default));
```

### 3. `index.ts` - Exports

```typescript
// Server: Services - requires server environment
export * from "./service.js";
export * from "./rpc-live.js";
```

## Integration Steps

### 1. Wire into Core Layer

Update `packages/quiz/src/core/server/layer.ts`:

```typescript
import { ResponsesRpcLive } from "../../features/responses/server/index.js";

export const QuizRpcLive = Layer.mergeAll(
  QuizzesRpcLive,
  AnalysisRpcLive,
  AnalysisEngineRpcLive,
  ResponsesRpcLive // Add this
);
```

### 2. Update Runtime (if needed)

If the service needs to be available in the runtime, update `packages/quiz/src/core/server/runtime.ts`.

## RPC Method Reference

From `domain/rpc.ts`:

- `response_list` - List all responses
- `response_getById` - Get response by ID (error: ResponseNotFoundError)
- `response_getByQuiz` - Get responses by quiz ID (error: InvalidQuizError)
- `response_upsert` - Create/update response (error: ResponseNotFoundError | InvalidQuizError)
- `response_delete` - Soft delete response (error: ResponseNotFoundError)

## Repo Methods Available

From `database/repo.ts`:

- `findAll()` - Get all responses
- `findById(id)` - Get by ID (throws ResponseNotFoundError)
- `findByQuizId(quizId)` - Get all for a quiz
- `create(input)` - Create new response
- `update(input)` - Update existing response
- `del(id)` - Soft delete
- `hardDelete(id)` - Permanent delete
- `insert(input)` - Insert with custom createdAt (for seeding)

## Notes

- The `getByQuiz` method should validate the quiz exists before querying responses
- The `upsert` method should validate the quiz exists before creating/updating
- Error types must match the RPC definitions exactly
