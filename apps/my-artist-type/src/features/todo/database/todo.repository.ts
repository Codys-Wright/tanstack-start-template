import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { PgLive } from "@/features/core/database";
import type { UserId } from "@/features/auth/domain/auth.user-id";
import {
  CreateTodoInput,
  Todo,
  TodoId,
  UpdateTodoInput,
} from "../domain/todo-schema.js";

/**
 * TodoRepository - Database access layer for todos using Effect SQL.
 * Provides type-safe SQL operations with automatic validation.
 */
export class TodoRepository extends Effect.Service<TodoRepository>()(
  "TodoRepository",
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Find all todos for a specific user
      const findByUserId = SqlSchema.findAll({
        Request: Schema.Struct({ userId: Schema.String }),
        Result: Todo,
        execute: (req) => sql`
					SELECT 
						id,
						user_id as "userId",
						title,
						completed,
						created_at as "createdAt",
						updated_at as "updatedAt"
					FROM todos 
					WHERE user_id = ${req.userId}
					ORDER BY created_at DESC
				`,
      });

      // Find a single todo by ID and user ID (ensures ownership)
      const findById = SqlSchema.single({
        Request: Schema.Struct({
          id: Schema.String,
          userId: Schema.String,
        }),
        Result: Todo,
        execute: (req) => sql`
					SELECT 
						id,
						user_id as "userId",
						title,
						completed,
						created_at as "createdAt",
						updated_at as "updatedAt"
					FROM todos 
					WHERE id = ${req.id} AND user_id = ${req.userId}
				`,
      });

      // Insert a new todo
      const insert = SqlSchema.single({
        Request: Schema.Struct({
          userId: Schema.String,
          title: Schema.String,
          completed: Schema.Boolean,
        }),
        Result: Todo,
        execute: (req) => sql`
					INSERT INTO todos (user_id, title, completed)
					VALUES (${req.userId}, ${req.title}, ${req.completed})
					RETURNING 
						id,
						user_id as "userId",
						title,
						completed,
						created_at as "createdAt",
						updated_at as "updatedAt"
				`,
      });

      // Update an existing todo
      const update = SqlSchema.single({
        Request: Schema.Struct({
          id: Schema.String,
          userId: Schema.String,
          title: Schema.optional(Schema.String),
          completed: Schema.optional(Schema.Boolean),
        }),
        Result: Todo,
        execute: (req) => sql`
					UPDATE todos 
					SET 
						title = COALESCE(${req.title}, title),
						completed = COALESCE(${req.completed}, completed),
						updated_at = now()
					WHERE id = ${req.id} AND user_id = ${req.userId}
					RETURNING 
						id,
						user_id as "userId",
						title,
						completed,
						created_at as "createdAt",
						updated_at as "updatedAt"
				`,
      });

      // Delete a todo
      const deleteTodo = SqlSchema.void({
        Request: Schema.Struct({
          id: Schema.String,
          userId: Schema.String,
        }),
        execute: (req) => sql`
					DELETE FROM todos 
					WHERE id = ${req.id} AND user_id = ${req.userId}
				`,
      });

      return {
        findByUserId,
        findById,
        insert,
        update,
        delete: deleteTodo,
      } as const;
    }),
  },
) {}
