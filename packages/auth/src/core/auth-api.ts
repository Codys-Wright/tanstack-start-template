import * as HttpApi from '@effect/platform/HttpApi';
import { AccountApiGroup } from '@auth/features/account';
import { SessionApiGroup } from '@auth/features/session';
import { AdminApiGroup } from '@auth/features/admin';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AdminApiGroup)
  .add(AccountApiGroup)
  .prefix('/effect-auth') {}
