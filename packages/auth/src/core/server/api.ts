import * as HttpApi from "@effect/platform/HttpApi";
import { SessionApiGroup } from "../../../features/session";
import { AccountApiGroup } from "../../../features/account";
import { OrganizationApiGroup } from "../../../features/organization";
import { SecurityApiGroup } from "../../../features/security";

export class AuthApi extends HttpApi.make("auth-api")
  .add(SessionApiGroup)
  .add(AccountApiGroup)
  .add(OrganizationApiGroup)
  .add(SecurityApiGroup)
  .prefix("/effect-auth") {}
