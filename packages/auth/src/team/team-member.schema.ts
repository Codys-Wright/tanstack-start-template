import * as Schema from "effect/Schema";
import { UserId } from "../user/user.schema.js";
import { TeamId } from "./team.schema.js";

/**
 * TeamMember entity - represents a user's membership in a team
 */
export class TeamMember extends Schema.Class<TeamMember>("TeamMember")({
  id: Schema.String.pipe(Schema.brand("TeamMemberId")),
  teamId: TeamId,
  userId: UserId,
  createdAt: Schema.DateTimeUtc,
}) {}

/**
 * TeamMember with user details populated
 * Used in API responses for listing team members
 */
export class TeamMemberWithUser extends Schema.Class<TeamMemberWithUser>(
  "TeamMemberWithUser"
)({
  id: Schema.String.pipe(Schema.brand("TeamMemberId")),
  teamId: TeamId,
  userId: UserId,
  createdAt: Schema.DateTimeUtc,
  user: Schema.Struct({
    id: UserId,
    name: Schema.String,
    email: Schema.String,
    image: Schema.NullOr(Schema.String),
  }),
}) {}
