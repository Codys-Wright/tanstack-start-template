/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export { auth } from "./features/_core/auth";
export * from "./features/_core/auth.context";
export * from "./features/_core/auth.policy";
export * from "./features/_core/better-auth.config";
export * from "./features/_core/better-auth.router";
export { BetterAuthService, Unauthenticated } from "./features/_core/better-auth.service";
export * from "./features/_core/email.service";
export * from "./features/_core/auth.http-middleware";
export * from "./features/_core/auth.rpc-middleware";
