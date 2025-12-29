import * as HttpApi from '@effect/platform/HttpApi';
import { AccountApiGroup } from '@auth/account/domain/api.js';
import { SessionApiGroup } from '@auth/session/domain/api.js';
import { AdminApiGroup } from '@auth/admin/domain/api.js';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AccountApiGroup)
  .prefix('/effect-auth') {}
