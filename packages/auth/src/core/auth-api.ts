import * as HttpApi from '@effect/platform/HttpApi';
import { AccountApiGroup } from '@auth/features/account';
import { SessionApiGroup } from '@auth/features/session';
import { AdminApiGroup } from '@auth/features/admin';
import { OrganizationApiGroup } from '@auth/features/organization/domain/api';
import { TeamApiGroup } from '@auth/features/team/domain/api';
import { MemberApiGroup } from '@auth/features/member/domain/api';
import { InvitationApiGroup } from '@auth/features/invitation/domain/api';
import { SecurityApiGroup } from '@auth/features/security/domain/api';

export class AuthApi extends HttpApi.make('auth-api')
  .add(SessionApiGroup)
  .add(AdminApiGroup)
  .add(AccountApiGroup)
  .add(OrganizationApiGroup)
  .add(TeamApiGroup)
  .add(MemberApiGroup)
  .add(InvitationApiGroup)
  .add(SecurityApiGroup)
  .prefix('/effect-auth') {}
