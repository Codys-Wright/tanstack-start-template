import * as HttpApi from '@effect/platform/HttpApi';
import { AccountApiGroup } from '../account/domain/api.js';
import { SessionApiGroup } from '../session/domain/api.js';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AccountApiGroup)
  .prefix('/effect-auth') {}
