/**
 * @auth/server - Server-side authentication exports
 *
 * Services, middleware, routers - requires server environment
 */

// ============================================================================
// Core - Server infrastructure
// ============================================================================
export * from './features/_core/config';
export * from './features/_core/middleware';
export * from './features/_core/router';
export { AuthService, Unauthenticated } from './features/_core/service';

// ============================================================================
// Effect HttpApi - Typed authentication API
// ============================================================================
export * from './features/_core/errors';
export * from './features/_core/auth-api';
export * from './features/_core/auth-api-live';
export * from './features/session/session-api';
export * from './features/session/session-api-live';
