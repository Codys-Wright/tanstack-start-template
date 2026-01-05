/**
 * @sse - Server-Sent Events package for TanStack Start
 *
 * Provides a complete SSE solution with:
 * - Server: Hub for managing connections, Response helpers
 * - Client: EventSource wrapper, Effect Stream integration
 * - Domain: Type-safe event schemas
 *
 * Usage:
 * - Import domain types from '@sse' (this file)
 * - Import server utilities from '@sse/server'
 * - Import client utilities from '@sse/client'
 */

export * from './domain/index.js';
