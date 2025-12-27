import * as Rpc from "@effect/rpc/Rpc";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as Schema from "effect/Schema";
import { User } from "../user/user.schema.js";
import { InvitationStatus } from "../invitation/invitation.schema.js";
import { OrganizationRole } from "../member/member.schema.js";

/**
 * Admin RPC Schema - Defines admin data fetching operations
 */

// ===== RESPONSE SCHEMAS =====

export const OrganizationWithMemberCount = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  metadata: Schema.optional(Schema.Unknown),
  createdAt: Schema.DateTimeUtc,
  memberCount: Schema.Number,
});

export const SessionWithUser = Schema.Struct({
  id: Schema.String,
  expiresAt: Schema.DateTimeUtc,
  token: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  ipAddress: Schema.optional(Schema.String),
  userAgent: Schema.optional(Schema.String),
  userId: Schema.String,
  activeOrganizationId: Schema.optional(Schema.NullOr(Schema.String)),
  activeTeamId: Schema.optional(Schema.NullOr(Schema.String)),
  impersonatedBy: Schema.optional(Schema.NullOr(Schema.String)),
  userName: Schema.String,
  userEmail: Schema.String,
});

export const InvitationWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: InvitationStatus,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
  inviterId: Schema.optional(Schema.String),
  organizationName: Schema.String,
  teamId: Schema.optional(Schema.NullOr(Schema.String)),
  inviterName: Schema.optional(Schema.NullOr(Schema.String)),
});

export const MemberWithDetails = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
  userName: Schema.String,
  userEmail: Schema.String,
  userImage: Schema.NullOr(Schema.String),
  organizationName: Schema.String,
  organizationSlug: Schema.String,
});

// ===== RPC GROUP =====

export class AdminRpc extends RpcGroup.make(
  Rpc.make("listAllUsers", {
    success: Schema.Array(User),
  }),

  Rpc.make("listAllOrganizations", {
    success: Schema.Array(OrganizationWithMemberCount),
  }),

  Rpc.make("listAllSessions", {
    success: Schema.Array(SessionWithUser),
  }),

  Rpc.make("listAllInvitations", {
    success: Schema.Array(InvitationWithDetails),
  }),

  Rpc.make("listAllMembers", {
    success: Schema.Array(MemberWithDetails),
  }),
).prefix("admin_") {}
