// import { CreateTodoForm, TodoList } from "../../features/todo/client";
import { ThemeDropdown } from "@theme";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <ThemeDropdown />
        </div>
        <p className="text-muted-foreground mb-4">
          Use the navigation above to test theme persistence across different
          pages.
        </p>
        {/* <CreateTodoForm />
        <TodoList /> */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">Todo components are commented out to avoid auth dependencies.</p>
        </div>
      </div>
    </div>
  );
}
