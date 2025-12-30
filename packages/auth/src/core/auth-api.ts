import * as HttpApi from "@effect/platform/HttpApi";
import { AccountApiGroup } from "../../features/account";
import { SessionApiGroup } from "../../features/session";
import { AdminApiGroup } from "../../features/admin";

export class AuthApi extends HttpApi.make("auth-api")
  .add(SessionApiGroup)
  .add(AdminApiGroup)
  .add(AccountApiGroup)
  .prefix("/effect-auth") {}
