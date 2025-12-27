/**
 * @auth - Authentication & Authorization Package (Client)
 *
 * Client-side authentication components and state management.
 * Server-side code (repositories, services, middleware) is not exported.
 *
 * Features:
 * - Client-side auth client (Better Auth)
 * - Reactive state management (Effect-Atom)
 * - UI components for authentication
 * - Type-safe schemas and types
 *
 * @example
 * ```tsx
 * // Import client components
 * import { UserButton, SignInForm } from "@auth";
 *
 * // Import state management
 * import { sessionAtom, signInAtom } from "@auth";
 *
 * // Import types
 * import type { User, Session } from "@auth";
 * ```
 */

// ============================================================================
// Core - Client-side authentication
// ============================================================================

// Export client-safe core items
export {
  // Better Auth client (browser-compatible)
  authClient,

  // Auth schemas (types only)
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  SignOutResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./_core/index.js";

// ============================================================================
// Session - Client-side session management
// ============================================================================

// Only export client-safe items (schemas, atoms, and UI)
export * from "./session/session.schema.js";
export * from "./session/session.atoms.js";
export * from "./session/ui/index.js";

// ============================================================================
// User - Client-side user components
// ============================================================================

// Only export client-safe items (schemas and UI)
export * from "./user/user.schema.js";
export * from "./user/ui/index.js";
