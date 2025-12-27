#!/usr/bin/env bun
import * as Effect from "effect/Effect";
import * as BunRuntime from "@effect/platform-bun/BunRuntime";
import pg from "pg";

const { Pool } = pg;

const addFakeColumnProgram = Effect.gen(function* () {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return yield* Effect.fail(new Error("DATABASE_URL not set"));
  }

  yield* Effect.log("🔍 Checking if 'fake' column exists...");

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Check if column exists
    const checkResult = yield* Effect.tryPromise({
      try: () =>
        pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'fake'
        `),
      catch: (error) => new Error(`Failed to check column: ${error}`),
    });

    if (checkResult.rows.length > 0) {
      yield* Effect.log("✅ Column 'fake' already exists!");
      return;
    }

    yield* Effect.log("📝 Adding 'fake' column to user table...");

    // Add the column
    yield* Effect.tryPromise({
      try: () =>
        pool.query(`
          ALTER TABLE "user" 
          ADD COLUMN fake BOOLEAN DEFAULT false NOT NULL
        `),
      catch: (error) => new Error(`Failed to add column: ${error}`),
    });

    yield* Effect.log("✅ Successfully added 'fake' column!");
  } finally {
    yield* Effect.tryPromise({
      try: () => pool.end(),
      catch: () => new Error("Failed to close pool"),
    });
  }
});

BunRuntime.runMain(addFakeColumnProgram);
