import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { AuthError, Unauthenticated } from '../session/session.schema.js';
import { User } from '../user/user.schema.js';
import { ChangeEmailInput, ChangePasswordInput, UpdateUserInput } from './account.schema.js';

/**
 * Response for change email request
 */
export class ChangeEmailResponse extends Schema.Class<ChangeEmailResponse>('ChangeEmailResponse')({
  success: Schema.Boolean,
  message: Schema.optional(Schema.String),
}) {}

/**
 * Response for change password request
 */
export class ChangePasswordResponse extends Schema.Class<ChangePasswordResponse>(
  'ChangePasswordResponse',
)({
  success: Schema.Boolean,
}) {}

/**
 * Response for delete account request
 */
export class DeleteAccountResponse extends Schema.Class<DeleteAccountResponse>(
  'DeleteAccountResponse',
)({
  success: Schema.Boolean,
}) {}

/**
 * AccountApiGroup - HTTP API group for account management operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /me - Get current user profile
 * - PATCH /me - Update current user profile
 * - POST /change-email - Request email change (sends verification)
 * - POST /change-password - Change password
 * - DELETE /me - Delete account
 */
export class AccountApiGroup extends HttpApiGroup.make('account')
  .add(HttpApiEndpoint.get('getProfile', '/me').addSuccess(User).addError(Unauthenticated))
  .add(
    HttpApiEndpoint.patch('updateProfile', '/me')
      .setPayload(UpdateUserInput)
      .addSuccess(User)
      .addError(Unauthenticated)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('changeEmail', '/change-email')
      .setPayload(ChangeEmailInput)
      .addSuccess(ChangeEmailResponse)
      .addError(Unauthenticated)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('changePassword', '/change-password')
      .setPayload(ChangePasswordInput)
      .addSuccess(ChangePasswordResponse)
      .addError(Unauthenticated)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.del('deleteAccount', '/me')
      .addSuccess(DeleteAccountResponse)
      .addError(Unauthenticated)
      .addError(AuthError),
  )
  .prefix('/account') {}
