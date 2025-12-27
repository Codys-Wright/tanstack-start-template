import * as Schema from "effect/Schema";
import { UserId } from "../user/user.schema.js";
import { OrganizationId } from "../organization/organization.schema.js";

/**
 * Organization role type
 * Default roles: owner, admin, member
 * Can be extended with custom roles via dynamic access control
 */
export const OrganizationRole = Schema.Union(
  Schema.Literal("owner"),
  Schema.Literal("admin"),
  Schema.Literal("member"),
  Schema.String // Custom roles
);
export type OrganizationRole = typeof OrganizationRole.Type;

/**
 * Member entity - represents a user's membership in an organization
 */
export class Member extends Schema.Class<Member>("Member")({
  id: Schema.String.pipe(Schema.brand("MemberId")),
  organizationId: OrganizationId,
  userId: UserId,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
}) {}

/**
 * Member with user details populated
 * Used in API responses for listing members
 */
export class MemberWithUser extends Schema.Class<MemberWithUser>(
  "MemberWithUser"
)({
  id: Schema.String.pipe(Schema.brand("MemberId")),
  organizationId: OrganizationId,
  userId: UserId,
  role: OrganizationRole,
  createdAt: Schema.DateTimeUtc,
  user: Schema.Struct({
    id: UserId,
    name: Schema.String,
    email: Schema.String,
    image: Schema.NullOr(Schema.String),
  }),
}) {}
