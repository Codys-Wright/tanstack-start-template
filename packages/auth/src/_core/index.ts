/**
 * Core authentication infrastructure
 * 
 * Exports fundamental authentication services, middleware, and schemas
 */

// Better Auth integration
export * from "./auth.client.js";
export * from "./auth.js";
export * from "./better-auth.config.js";
export * from "./better-auth.database.js";
export * from "./better-auth.router.js";
export * from "./better-auth.service.js";

// Email service
export * from "./email.service.js";

// Core auth schemas (sign in, sign up, password reset)
export * from "./auth.schema.js";

// Authentication context & middleware
export * from "./auth.context.js";
export * from "./auth.policy.js";
export * from "./auth.http-middleware.js";
export * from "./auth.rpc-middleware.js";
