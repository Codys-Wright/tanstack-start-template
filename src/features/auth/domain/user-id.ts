import * as Schema from "effect/Schema";

/**
 * Branded UUID type for user identifiers.
 * Used across authentication and authorization contexts.
 */
export const UserId = Schema.UUID.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
