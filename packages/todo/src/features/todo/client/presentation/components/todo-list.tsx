import { Alert, Button } from '@shadcn';
import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { todosAtom } from '../../atoms.js';
import { TodoItem } from './todo-item.js';

export function TodoList() {
  const result = useAtomValue(todosAtom);
  const refreshTodos = useAtomRefresh(todosAtom);

  return (
    <div>
      {Result.builder(result)
        .onInitial(() => <p className="text-muted-foreground">Loading todos...</p>)
        .onSuccess((todos) => {
          return todos.length === 0 ? (
            <p className="text-muted-foreground">No todos yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          );
        })
        .onFailure((error) => {
          return (
            <Alert variant="destructive">
              <Alert.Title>Something went wrong loading todos.</Alert.Title>
              <Alert.Description>
                <div className="mb-2 text-sm">Error: {String(error)}</div>
                <Button onClick={refreshTodos} variant="outline" size="sm" className="mt-2">
                  Retry
                </Button>
              </Alert.Description>
            </Alert>
          );
        })
        .render()}
    </div>
  );
}
