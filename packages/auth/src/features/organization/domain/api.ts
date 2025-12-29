import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  CreateOrganizationInput,
  DeleteOrganizationInput,
  Organization,
  OrganizationNotFoundError,
  OrganizationValidationError,
  OrganizationId,
  SetActiveOrganizationInput,
  UpdateOrganizationInput,
} from './schema.js';

/**
 * OrganizationApiGroup - HTTP API group for organization management operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /organizations - List all organizations
 * - GET /organizations/:id - Get organization by ID
 * - POST /organizations/create - Create new organization
 * - PATCH /organizations/update - Update organization
 * - DELETE /organizations/delete - Delete organization
 * - POST /organizations/set-active - Set active organization
 */
export class OrganizationApiGroup extends HttpApiGroup.make('organizations')
  .add(HttpApiEndpoint.get('list', '/organizations').addSuccess(Schema.Array(Organization)))
  .add(
    HttpApiEndpoint.get('getById', '/organizations/:id')
      .setPath(Schema.Struct({ id: OrganizationId }))
      .addSuccess(Organization)
      .addError(OrganizationNotFoundError),
  )
  .add(
    HttpApiEndpoint.post('create', '/organizations/create')
      .setPayload(CreateOrganizationInput)
      .addSuccess(Organization)
      .addError(OrganizationValidationError),
  )
  .add(
    HttpApiEndpoint.patch('update', '/organizations/update')
      .setPayload(UpdateOrganizationInput)
      .addSuccess(Organization)
      .addError(OrganizationNotFoundError)
      .addError(OrganizationValidationError),
  )
  .add(
    HttpApiEndpoint.del('delete', '/organizations/delete')
      .setPayload(DeleteOrganizationInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(OrganizationNotFoundError),
  )
  .add(
    HttpApiEndpoint.post('setActive', '/organizations/set-active')
      .setPayload(SetActiveOrganizationInput)
      .addSuccess(Organization)
      .addError(OrganizationNotFoundError),
  )
  .prefix('/organizations') {}
