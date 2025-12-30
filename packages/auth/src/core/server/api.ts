import * as HttpApi from '@effect/platform/HttpApi';
import { SessionApiGroup } from '@auth/features/session';
import { AccountApiGroup } from '@auth/features/account';
import { OrganizationApiGroup } from '@auth/features/organization';
import { SecurityApiGroup } from '@auth/features/security';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AccountApiGroup)
  .add(OrganizationApiGroup)
  .add(SecurityApiGroup)
  .prefix('/effect-auth') {}
