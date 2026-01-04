/**
 * Auth tables migration for testing.
 * Creates tables that Better Auth normally manages.
 * These match the Better Auth schema structure.
 */
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // User table
  yield* sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      role TEXT,
      banned BOOLEAN DEFAULT false,
      ban_reason TEXT,
      ban_expires TIMESTAMPTZ,
      two_factor_enabled BOOLEAN DEFAULT false,
      is_anonymous BOOLEAN DEFAULT false,
      fake BOOLEAN DEFAULT false
    )
  `;

  // Session table
  yield* sql`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      active_organization_id TEXT,
      active_team_id TEXT,
      impersonated_by TEXT
    )
  `;

  // Account table (for OAuth providers)
  yield* sql`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Organization table
  yield* sql`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      fake BOOLEAN DEFAULT false
    )
  `;

  // Member table (organization members)
  yield* sql`
    CREATE TABLE IF NOT EXISTS member (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Invitation table
  yield* sql`
    CREATE TABLE IF NOT EXISTS invitation (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Verification table (for email verification tokens, etc.)
  yield* sql`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Indexes
  yield* sql`CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_session_user_id ON session (user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_session_token ON session (token)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_account_user_id ON account (user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_member_org_id ON member (organization_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_member_user_id ON member (user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_invitation_org_id ON invitation (organization_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_organization_slug ON organization (slug)`;
});
