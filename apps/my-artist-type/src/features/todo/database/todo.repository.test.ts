import { PgTest } from "../../core/database";
import { describe, expect, it } from "@effect/vitest";
import type { UserId } from "../../../packages/auth/src";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { randomUUID } from "node:crypto";
import { TodoRepository } from "./todo.repository.js";

const Live = TodoRepository.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest)
);

const makeUserId = () => randomUUID() as UserId;

it.layer(Live, { timeout: "30 seconds" })("TodoRepository", (it) => {
  describe("insert", () => {
    it.effect(
      "creates a todo with generated id and timestamps",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const created = yield* repo.insert({
          userId,
          title: "Test Todo Item",
          completed: false,
        });

        expect(created.title).toBe("Test Todo Item");
        expect(created.completed).toBe(false);
        expect(created.userId).toBe(userId);
        expect(created.id).toBeDefined();
        expect(created.createdAt).toBeDefined();
        expect(created.updatedAt).toBeDefined();
      })
    );
  });

  describe("findByUserId", () => {
    it.effect(
      "returns todos for a specific user",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        yield* repo.insert({
          userId,
          title: "User's Todo",
          completed: false,
        });

        const found = yield* repo.findByUserId({ userId });

        expect(found).toHaveLength(1);
        expect(found[0].title).toBe("User's Todo");
      })
    );

    it.effect(
      "returns empty array for user with no todos",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const found = yield* repo.findByUserId({ userId });

        expect(found).toHaveLength(0);
      })
    );

    it.effect(
      "isolates data between users",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId1 = makeUserId();
        const userId2 = makeUserId();

        yield* repo.insert({
          userId: userId1,
          title: "User1 Todo",
          completed: false,
        });
        yield* repo.insert({
          userId: userId2,
          title: "User2 Todo",
          completed: false,
        });

        const user1Todos = yield* repo.findByUserId({ userId: userId1 });
        expect(user1Todos).toHaveLength(1);
        expect(user1Todos[0].title).toBe("User1 Todo");

        const user2Todos = yield* repo.findByUserId({ userId: userId2 });
        expect(user2Todos).toHaveLength(1);
        expect(user2Todos[0].title).toBe("User2 Todo");
      })
    );
  });

  describe("update", () => {
    it.effect(
      "updates todo fields",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const created = yield* repo.insert({
          userId,
          title: "Original Title",
          completed: false,
        });

        const updated = yield* repo.update({
          id: created.id,
          userId,
          title: "Updated Title",
          completed: true,
        });

        expect(updated.title).toBe("Updated Title");
        expect(updated.completed).toBe(true);
        expect(updated.id).toBe(created.id);
      })
    );

    it.effect(
      "does not update todos belonging to other users",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId1 = makeUserId();
        const userId2 = makeUserId();

        const todo = yield* repo.insert({
          userId: userId1,
          title: "Protected Todo",
          completed: false,
        });

        const result = yield* Effect.either(
          repo.update({
            id: todo.id,
            userId: userId2,
            title: "Hacked Title",
            completed: true,
          })
        );

        expect(result._tag).toBe("Left"); // Should fail

        // Verify the todo wasn't changed
        const found = yield* repo.findByUserId({ userId: userId1 });
        expect(found).toHaveLength(1);
        expect(found[0].title).toBe("Protected Todo");
        expect(found[0].completed).toBe(false);
      })
    );
  });

  describe("delete", () => {
    it.effect(
      "removes todo",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const created = yield* repo.insert({
          userId,
          title: "To Be Deleted",
          completed: false,
        });

        yield* repo.delete({
          id: created.id,
          userId,
        });

        const found = yield* repo.findByUserId({ userId });
        expect(found).toHaveLength(0);
      })
    );

    it.effect(
      "does not delete todos belonging to other users",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId1 = makeUserId();
        const userId2 = makeUserId();

        const todo = yield* repo.insert({
          userId: userId1,
          title: "Protected Todo",
          completed: false,
        });

        yield* repo.delete({
          id: todo.id,
          userId: userId2,
        });

        // Todo should still exist
        const found = yield* repo.findByUserId({ userId: userId1 });
        expect(found).toHaveLength(1);
        expect(found[0].id).toBe(todo.id);
      })
    );
  });

  describe("findById", () => {
    it.effect(
      "returns todo when it exists and belongs to user",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const created = yield* repo.insert({
          userId,
          title: "My Todo",
          completed: false,
        });

        const found = yield* repo.findById({
          id: created.id,
          userId,
        });

        expect(found.title).toBe("My Todo");
        expect(found.id).toBe(created.id);
      })
    );

    it.effect(
      "fails when todo doesn't exist",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId = makeUserId();

        const result = yield* Effect.either(
          repo.findById({
            id: "nonexistent-id",
            userId,
          })
        );

        expect(result._tag).toBe("Left");
      })
    );

    it.effect(
      "fails when todo belongs to another user",
      Effect.fn(function* () {
        const repo = yield* TodoRepository;
        const userId1 = makeUserId();
        const userId2 = makeUserId();

        const todo = yield* repo.insert({
          userId: userId1,
          title: "Private Todo",
          completed: false,
        });

        const result = yield* Effect.either(
          repo.findById({
            id: todo.id,
            userId: userId2,
          })
        );

        expect(result._tag).toBe("Left");
      })
    );
  });
});
