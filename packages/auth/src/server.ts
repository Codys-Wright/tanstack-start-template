/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export * from './core/config.js';
export * from './core/server/middleware.js';
export * from './core/server/router.js';
export {
  AuthService,
  Unauthenticated,
  type OnLinkAccountCallback,
  makeBetterAuthOptions,
  // OnLinkAccountHandler for custom data migration when anonymous users claim accounts
  OnLinkAccountHandler,
  OnLinkAccountHandlerNoop,
  makeOnLinkAccountHandler,
  type LinkAccountData,
} from './core/server/service.js';

// ============================================================================
// Feature Services - Effect services for server-side auth operations
// ============================================================================
export { UserService } from './features/user/server/service.js';
export { SessionService } from './features/session/server/session-service.js';

// ============================================================================
// Permissions - Server-side permission checking
// ============================================================================
export {
  PermissionService,
  PermissionDenied,
  PermissionCheckFailed,
  type PermissionMap,
  type CheckPermissionInput,
  type CheckOrgPermissionInput,
} from './features/permissions/server/index.js';
