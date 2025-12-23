import { expect, it } from "bun:test";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { PgTest, withTransactionRollback } from "@/features/core/database";
import { TodoRepository } from "./todo.repository";
import type { UserId } from "@/features/auth/domain/auth.user-id";

const Live = TodoRepository.DefaultWithoutDependencies.pipe(
	Layer.provideMerge(PgTest),
);

it.layer(Live)("TodoRepository", (it) => {
	it.scoped(
		"insert and findByUserId",
		Effect.fn(function* () {
			const repo = yield* TodoRepository;

			// Insert a test todo
			const created = yield* repo.insert({
				userId: "test-user-123" as UserId,
				title: "Test Todo Item",
				completed: false,
			});

			expect(created.title).toBe("Test Todo Item");
			expect(created.completed).toBe(false);
			expect(created.userId).toBe("test-user-123");
			expect(created.id).toBeDefined();
			expect(created.createdAt).toBeDefined();
			expect(created.updatedAt).toBeDefined();

			// Find todos by user ID
			const found = yield* repo.findByUserId({ userId: "test-user-123" as UserId });

			expect(found).toHaveLength(1);
			expect(found[0].title).toBe("Test Todo Item");
		}, withTransactionRollback),
	);

	it.scoped(
		"update todo",
		Effect.fn(function* () {
			const repo = yield* TodoRepository;

			// Insert a test todo
			const created = yield* repo.insert({
				userId: "test-user-456" as UserId,
				title: "Original Title",
				completed: false,
			});

			// Update the todo
			const updated = yield* repo.update({
				id: created.id,
				userId: "test-user-456" as UserId,
				title: "Updated Title",
				completed: true,
			});

			expect(updated.title).toBe("Updated Title");
			expect(updated.completed).toBe(true);
			expect(updated.id).toBe(created.id);
		}, withTransactionRollback),
	);

	it.scoped(
		"delete todo",
		Effect.fn(function* () {
			const repo = yield* TodoRepository;

			// Insert a test todo
			const created = yield* repo.insert({
				userId: "test-user-789" as UserId,
				title: "To Be Deleted",
				completed: false,
			});

			// Delete the todo
			yield* repo.delete({
				id: created.id,
				userId: "test-user-789" as UserId,
			});

			// Verify it's gone
			const found = yield* repo.findByUserId({ userId: "test-user-789" as UserId });
			expect(found).toHaveLength(0);
		}, withTransactionRollback),
	);

	it.scoped(
		"ownership isolation",
		Effect.fn(function* () {
			const repo = yield* TodoRepository;

			// User 1 creates a todo
			const user1Todo = yield* repo.insert({
				userId: "user-1" as UserId,
				title: "User 1 Todo",
				completed: false,
			});

			// User 2 creates a todo
			yield* repo.insert({
				userId: "user-2" as UserId,
				title: "User 2 Todo",
				completed: false,
			});

			// User 1 should only see their own todo
			const user1Todos = yield* repo.findByUserId({ userId: "user-1" as UserId });
			expect(user1Todos).toHaveLength(1);
			expect(user1Todos[0].title).toBe("User 1 Todo");

			// User 2 should only see their own todo
			const user2Todos = yield* repo.findByUserId({ userId: "user-2" as UserId });
			expect(user2Todos).toHaveLength(1);
			expect(user2Todos[0].title).toBe("User 2 Todo");

			// User 2 cannot access User 1's todo
			const result = yield* Effect.either(
				repo.findById({
					id: user1Todo.id,
					userId: "user-2" as UserId,
				}),
			);

			expect(result._tag).toBe("Left"); // Should fail
		}, withTransactionRollback),
	);
});
