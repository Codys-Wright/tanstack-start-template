/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export * from "./core/config.js";
export * from "./core/server/middleware.js";
export * from "./core/server/router.js";
export { AuthService, Unauthenticated } from "./core/server/service.js";

// ============================================================================
// Effect HttpApi - Typed authentication API (server implementations)
// ============================================================================
export * from "./core/auth-api.js";
export * from "./core/server/auth-api-live.js";
export * from "./core/server/auth-api-routes.js";
export * from "./features/session/session-api-live.js";
export * from "./features/account/account-api-live.js";
