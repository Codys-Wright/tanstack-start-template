import { defineFeatureMigrations } from "@core/database";

// Import migration effects
import migration0001 from "./migrations/0001_todos_table";

/**
 * Todo package migrations
 *
 * These migrations are registered with the app's migration system.
 * Each migration has a unique ID within the todo feature.
 */
export const todoMigrations = defineFeatureMigrations("todo", [
  {
    id: 1,
    name: "todos_table",
    run: migration0001,
  },
]);
