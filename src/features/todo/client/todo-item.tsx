import type { Todo } from "../domain/todo-schema.js";
import { useAtomRefresh, useAtomSet } from "@effect-atom/atom-react";
import * as Option from "effect/Option";
import { useState, memo, useCallback } from "react";
import { todosAtom, updateTodoAtom, deleteTodoAtom } from "./todos-atoms.js";
import { Checkbox, Input, Button, Alert, Badge } from "@shadcn";

export const TodoItem = memo(function TodoItem({
  todo,
}: {
  readonly todo: Todo;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const update = useAtomSet(updateTodoAtom);
  const deleteTodo = useAtomSet(deleteTodoAtom);
  const refreshTodos = useAtomRefresh(todosAtom);

  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await update({
        id: todo.id,
        input: { title: Option.none(), completed: Option.some(!todo.completed) },
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Update failed"));
    } finally {
      setIsLoading(false);
    }
  }, [todo.id, todo.completed, update]);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteTodo(todo.id);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Delete failed"));
    } finally {
      setIsLoading(false);
    }
  }, [todo.id, deleteTodo]);

  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await update({
        id: todo.id,
        input: { title: Option.some(editTitle.trim()), completed: Option.none() },
      });
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Update failed"));
    } finally {
      setIsLoading(false);
    }
  }, [todo.id, editTitle, update]);

  const hasError = error !== null;

  return (
    <li
      className={`p-4 rounded-lg border-2 transition-colors ${
        hasError
          ? "border-destructive/50 bg-destructive/10"
          : "border-border bg-card hover:border-border/80"
      } ${isLoading ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => handleToggle()}
          disabled={isLoading}
        />
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditTitle(todo.title);
                }
              }}
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              size="sm"
            >
              Save
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditTitle(todo.title);
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col gap-1">
              <button
                type="button"
                className={`text-left cursor-pointer ${
                  todo.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
                onDoubleClick={() => setIsEditing(true)}
              >
                {todo.title}
              </button>
              <Badge variant="outline" className="font-mono text-xs w-fit">
                Owner: {todo.userId.substring(0, 8)}...
              </Badge>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              variant="ghost"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isLoading ? "..." : "Delete"}
            </Button>
          </>
        )}
      </div>
      {hasError && (
        <Alert variant="destructive" className="mt-2">
          <Alert.Description>
            Operation failed.{" "}
            <Button
              onClick={refreshTodos}
              variant="link"
              className="h-auto p-0 underline"
            >
              Refresh
            </Button>
          </Alert.Description>
        </Alert>
      )}
    </li>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the todo actually changed
  return (
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.title === nextProps.todo.title &&
    prevProps.todo.completed === nextProps.todo.completed &&
    prevProps.todo.userId === nextProps.todo.userId
  );
});

