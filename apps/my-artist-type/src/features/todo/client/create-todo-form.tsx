import { Result, useAtom } from "@effect-atom/atom-react";
import { useState } from "react";
import { createTodoAtom } from "./todos-atoms.js";
import { Input, Button, Alert } from "@shadcn";

export function CreateTodoForm() {
  const [title, setTitle] = useState("");
  const [createResult, create] = useAtom(createTodoAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedTitle = title.trim();
    setTitle("");
    create({ title: trimmedTitle });
  };

  const hasError = Result.isFailure(createResult);

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
          placeholder="What needs to be done?"
          disabled={createResult.waiting}
          className="flex-1"
        />
        <Button type="submit" disabled={createResult.waiting || !title.trim()}>
          {createResult.waiting ? "Adding..." : "Add"}
        </Button>
      </form>
      {hasError && (
        <Alert variant="destructive" className="mt-2">
          <Alert.Description>
            Failed to create todo. Please try again.
          </Alert.Description>
        </Alert>
      )}
    </div>
  );
}
