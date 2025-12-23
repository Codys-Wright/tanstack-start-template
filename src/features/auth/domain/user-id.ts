import * as Schema from "effect/Schema";

/**
 * Branded string type for user identifiers.
 * Better Auth uses non-UUID strings for user IDs by default.
 * Used across authentication and authorization contexts.
 */
export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
