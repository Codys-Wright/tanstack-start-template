import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { UserId } from "@/features/auth/domain/auth.user-id";
import {
	CreateTodoInput,
	TodoId,
	TodoNotFound,
	UpdateTodoInput,
} from "../domain/todo-schema.js";
import { TodoRepository } from "./todo.repository.js";

/**
 * TodosService - Business logic layer for todos.
 * Delegates to TodoRepository for database operations.
 */
export class TodosService extends Effect.Service<TodosService>()(
	"TodosService",
	{
		dependencies: [TodoRepository.Default],
		effect: Effect.gen(function* () {
			const repo = yield* TodoRepository;

			const list = (userId: UserId) =>
				Effect.gen(function* () {
					yield* Effect.log(`[TodosService.list] Fetching todos for user: ${userId}`);
					const todos = yield* repo.findByUserId({ userId });
					yield* Effect.log(`[TodosService.list] Found ${todos.length} todos`);
					return todos;
				});

			const getById = (id: TodoId, userId: UserId) =>
				repo.findById({ id, userId }).pipe(
					Effect.tap(() => Effect.log(`[TodosService.getById] Found todo: ${id}`)),
					Effect.mapError(() => new TodoNotFound({ id })),
					Effect.tapError(() =>
						Effect.log(`[TodosService.getById] Todo not found: ${id}`),
					),
				);

			const create = (input: CreateTodoInput, userId: UserId) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`[TodosService.create] Creating todo "${input.title}" for user: ${userId}`,
					);
					const todo = yield* repo.insert({
						userId,
						title: input.title,
						completed: false,
					});
					yield* Effect.log(`[TodosService.create] Created todo with id: ${todo.id}`);
					return todo;
				});

			const update = (id: TodoId, input: UpdateTodoInput, userId: UserId) =>
				Effect.gen(function* () {
					yield* Effect.log(`[TodosService.update] Updating todo: ${id}`);
					const updated = yield* repo.update({
						id,
						userId,
						title: Option.getOrUndefined(input.title),
						completed: Option.getOrUndefined(input.completed),
					});
					yield* Effect.log(`[TodosService.update] Updated todo: ${id}`);
					return updated;
				}).pipe(
					Effect.mapError(() => new TodoNotFound({ id })),
					Effect.tapError(() =>
						Effect.log(`[TodosService.update] Todo not found: ${id}`),
					),
				);

			const remove = (id: TodoId, userId: UserId) =>
				Effect.gen(function* () {
					yield* Effect.log(`[TodosService.remove] Deleting todo: ${id}`);
					yield* repo.delete({ id, userId });
					yield* Effect.log(`[TodosService.remove] Deleted todo: ${id}`);
				}).pipe(
					Effect.mapError(() => new TodoNotFound({ id })),
					Effect.tapError(() =>
						Effect.log(`[TodosService.remove] Todo not found: ${id}`),
					),
				);

			return {
				list,
				getById,
				create,
				update,
				remove,
			} as const;
		}),
	},
) {}
