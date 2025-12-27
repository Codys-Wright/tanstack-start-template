/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export { auth } from "./features/_core/auth.js";
export * from "./features/_core/better-auth.config.js";
export * from "./features/_core/better-auth.router.js";
export * from "./features/_core/better-auth.service.js";
export * from "./features/_core/email.service.js";
export * from "./features/_core/auth.http-middleware.js";
export * from "./features/_core/auth.rpc-middleware.js";
