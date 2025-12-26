// Domain schemas (safe for both client and server)
export * from "./domain/index.js";

// Client atoms and auth client
export * from "./client/atoms/index.js";
export { authClient } from "./client/auth.client.js";
export type {
	AuthClient,
	Invitation,
	Member,
	Organization,
	Session,
	Team,
} from "./client/auth.client.js";

// UI components
export * from "./ui/index.js";

// NOTE: Server exports moved to ./server/index.ts
// Import from "@/features/auth/server" for server-only code
