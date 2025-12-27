/**
 * @auth - Authentication & Authorization Package
 * 
 * Complete authentication system with:
 * - User management
 * - Session handling
 * - Account self-service
 * - Multi-tenancy (Organizations & Teams)
 * - Security features (2FA, Passkeys)
 * - Admin operations
 * 
 * @example
 * ```ts
 * // Import core auth
 * import { authClient, SignInInput } from "@auth";
 * 
 * // Import specific features
 * import { UserAvatar } from "@auth/user";
 * import { SignInForm } from "@auth/session";
 * import { OrganizationsCard } from "@auth/organization";
 * ```
 */

// ============================================================================
// Core - Authentication infrastructure
// ============================================================================

// Export everything from core except potential conflicts
export {
  // Better Auth
  authClient,
  
  // Services
  BetterAuthConfig,
  BetterAuthDatabase,
  BetterAuthRouter,
  BetterAuthService,
  EmailService,
  
  // Auth schemas
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  SignOutResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  
  // Context & Middleware
  AuthContext,
  RpcAuthenticationMiddleware,
  HttpAuthenticationMiddleware,
  HttpAuthenticationMiddlewareLive,
  RpcAuthenticationMiddlewareLive,
  
  // Shared types
  UserId,
} from "./_core/index.js";

// Re-export the auth CLI entry for better-auth commands
export { auth } from "./_core/auth.js";

// ============================================================================
// User - User management
// ============================================================================
export * from "./user/index.js";

// ============================================================================
// Session - Session & authentication
// ============================================================================
export * from "./session/index.js";

// ============================================================================
// Account - Profile & account management
// ============================================================================
export * from "./account/index.js";

// ============================================================================
// Security - 2FA & Passkeys
// ============================================================================
export * from "./security/index.js";

// ============================================================================
// Organization - Multi-tenancy
// ============================================================================
export * from "./organization/index.js";

// ============================================================================
// Team - Team management
// ============================================================================
export * from "./team/index.js";

// ============================================================================
// Member - Organization membership
// ============================================================================
export * from "./member/index.js";

// ============================================================================
// Invitation - Org invitations
// ============================================================================
export * from "./invitation/index.js";

// ============================================================================
// Admin - Admin operations
// ============================================================================
export * from "./admin/index.js";

// ============================================================================
// Database - Migrations
// ============================================================================
export { authMigrations } from "./database/migrations.js";
