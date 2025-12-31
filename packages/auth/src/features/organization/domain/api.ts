import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  CreateOrganizationInput,
  DeleteOrganizationInput,
  Organization,
  SetActiveOrganizationInput,
  UpdateOrganizationInput,
  LeaveOrganizationInput,
  CheckSlugInput,
  CheckSlugResponse,
  OrgHasPermissionInput,
  OrgHasPermissionResponse,
  OrganizationMember,
  OrganizationError,
} from './schema.js';

/**
 * OrganizationApiGroup - HTTP API group for organization management.
 * Matches Better Auth Organization Plugin OpenAPI spec.
 *
 * This is composed into AuthApi.
 *
 * Endpoints (matching Better Auth):
 * - POST /organization/create - Create an organization
 * - GET /organization/list - List all organizations for current user
 * - GET /organization/get-full-organization - Get current organization details
 * - POST /organization/update - Update an organization
 * - POST /organization/delete - Delete an organization
 * - POST /organization/set-active - Set active organization
 * - POST /organization/leave - Leave an organization
 * - POST /organization/check-slug - Check if slug is available
 * - POST /organization/has-permission - Check if user has permission
 * - GET /organization/get-active-member - Get active member details
 * - GET /organization/get-active-member-role - Get active member role
 */
export class OrganizationApiGroup extends HttpApiGroup.make('organization')
  // Create organization
  .add(
    HttpApiEndpoint.post('create', '/create')
      .setPayload(CreateOrganizationInput)
      .addSuccess(Organization)
      .addError(OrganizationError),
  )
  // List organizations
  .add(
    HttpApiEndpoint.get('list', '/list')
      .addSuccess(Schema.Array(Organization))
      .addError(OrganizationError),
  )
  // Get full organization (current active)
  .add(
    HttpApiEndpoint.get('getFullOrganization', '/get-full-organization')
      .addSuccess(Schema.NullOr(Organization))
      .addError(OrganizationError),
  )
  // Update organization
  .add(
    HttpApiEndpoint.post('update', '/update')
      .setPayload(UpdateOrganizationInput)
      .addSuccess(Organization)
      .addError(OrganizationError),
  )
  // Delete organization
  .add(
    HttpApiEndpoint.post('delete', '/delete')
      .setPayload(DeleteOrganizationInput)
      .addSuccess(Schema.String) // Returns the deleted organization ID
      .addError(OrganizationError),
  )
  // Set active organization
  .add(
    HttpApiEndpoint.post('setActive', '/set-active')
      .setPayload(SetActiveOrganizationInput)
      .addSuccess(Schema.NullOr(Organization))
      .addError(OrganizationError),
  )
  // Leave organization
  .add(
    HttpApiEndpoint.post('leave', '/leave')
      .setPayload(LeaveOrganizationInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(OrganizationError),
  )
  // Check if slug is available
  .add(
    HttpApiEndpoint.post('checkSlug', '/check-slug')
      .setPayload(CheckSlugInput)
      .addSuccess(CheckSlugResponse)
      .addError(OrganizationError),
  )
  // Check permissions
  .add(
    HttpApiEndpoint.post('hasPermission', '/has-permission')
      .setPayload(OrgHasPermissionInput)
      .addSuccess(OrgHasPermissionResponse)
      .addError(OrganizationError),
  )
  // Get active member
  .add(
    HttpApiEndpoint.get('getActiveMember', '/get-active-member')
      .addSuccess(Schema.NullOr(OrganizationMember))
      .addError(OrganizationError),
  )
  // Get active member role
  .add(
    HttpApiEndpoint.get('getActiveMemberRole', '/get-active-member-role')
      .addSuccess(Schema.NullOr(Schema.String))
      .addError(OrganizationError),
  )
  .prefix('/organization') {}
