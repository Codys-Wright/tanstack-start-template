import * as HttpApi from '@effect/platform/HttpApi';
import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { CreateTodoInput, Todo, TodoId, TodoNotFound, UpdateTodoInput } from './todo-schema.js';

/**
 * TodosApiGroup - HTTP REST API group for todos.
 * This provides REST endpoints that map to TodosService operations.
 */
export class TodosApiGroup extends HttpApiGroup.make('todos')
  .add(HttpApiEndpoint.get('list', '/todos').addSuccess(Schema.Array(Todo)))
  .add(
    HttpApiEndpoint.get('getById', '/todos/:id')
      .setPath(Schema.Struct({ id: TodoId }))
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(HttpApiEndpoint.post('create', '/todos').setPayload(CreateTodoInput).addSuccess(Todo))
  .add(
    HttpApiEndpoint.patch('update', '/todos/:id')
      .setPath(Schema.Struct({ id: TodoId }))
      .setPayload(UpdateTodoInput)
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(
    HttpApiEndpoint.del('remove', '/todos/:id')
      .setPath(Schema.Struct({ id: TodoId }))
      .addSuccess(Schema.Void)
      .addError(TodoNotFound),
  ) {}

/**
 * TodosApi - Standalone HTTP API for todos.
 * Used with HttpLayerRouter.addHttpApi for composing routes at the server level.
 * Note: No prefix here - composed at app level with AppApi.
 */
export class TodosApi extends HttpApi.make('todos-api').add(TodosApiGroup) {}
