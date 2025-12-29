import * as HttpApi from '@effect/platform/HttpApi';
import { SessionApiGroup } from '../../features/session/domain/api.js';
import { AccountApiGroup } from '../../features/account/domain/api.js';
import { OrganizationApiGroup } from '../../features/organization/domain/api.js';
import { SecurityApiGroup } from '../../features/security/domain/api.js';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AccountApiGroup)
  .add(OrganizationApiGroup)
  .add(SecurityApiGroup)
  .prefix('/effect-auth') {}
