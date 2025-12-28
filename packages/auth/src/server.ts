/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export * from "./features/_core/config";
export * from "./features/_core/middleware";
export * from "./features/_core/router";
export { AuthService, Unauthenticated } from "./features/_core/service";
