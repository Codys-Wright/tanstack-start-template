import { defineFeatureMigrations } from "@core/database";

// Import migration effects
import migration0001 from "./migrations/0001_users_table.js";
import migration0002 from "./migrations/0002_static_user.js";

/**
 * Auth package migrations
 * 
 * These migrations are registered with the app's migration system.
 * Each migration has a unique ID within the auth feature.
 */
export const authMigrations = defineFeatureMigrations("auth", [
  {
    id: 1,
    name: "users_table",
    run: migration0001,
  },
  {
    id: 2,
    name: "static_user",
    run: migration0002,
  },
]);
