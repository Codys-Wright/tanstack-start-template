/**
 * @auth - Authentication & Authorization Package
 *
 * Facade package that re-exports domain types and client components.
 *
 * Sub-packages (import directly for better tree-shaking):
 * - @auth/domain - Pure domain schemas and types
 * - @auth/client - React components, hooks, and atoms
 * - @auth/server - Server-side services and middleware (server-only)
 * - @auth/database - Repositories and migrations (server-only)
 *
 * @example
 * ```tsx
 * // Import from facade (convenience)
 * import { User, Session } from "@auth";
 * import { UserButton, SignInForm } from "@auth/client";
 *
 * // Or import from specific packages (recommended)
 * import type { User, Session } from "@auth/domain";
 * import { UserButton, SignInForm } from "@auth/client";
 * ```
 */

// ============================================================================
// Domain - Pure schemas and types
// ============================================================================
export * from '@auth/domain';
