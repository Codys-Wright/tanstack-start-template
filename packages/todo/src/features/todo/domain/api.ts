import * as HttpApi from '@effect/platform/HttpApi';
import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as S from 'effect/Schema';
import { CreateTodoInput, Todo, TodoId, TodoNotFound, UpdateTodoInput } from './schema.js';

/**
 * TodoApiGroup - HTTP REST API group for todos.
 * This provides REST endpoints that map to TodoService operations.
 */
export class TodoApiGroup extends HttpApiGroup.make('todos')
  .add(HttpApiEndpoint.get('list', '/todos').addSuccess(S.Array(Todo)))
  .add(
    HttpApiEndpoint.get('getById', '/todos/:id')
      .setPath(S.Struct({ id: TodoId }))
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(HttpApiEndpoint.post('create', '/todos').setPayload(CreateTodoInput).addSuccess(Todo))
  .add(
    HttpApiEndpoint.patch('update', '/todos/:id')
      .setPath(S.Struct({ id: TodoId }))
      .setPayload(UpdateTodoInput)
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(
    HttpApiEndpoint.del('remove', '/todos/:id')
      .setPath(S.Struct({ id: TodoId }))
      .addSuccess(S.Void)
      .addError(TodoNotFound),
  ) {}

/**
 * TodoApi - Standalone HTTP API for todos.
 * Used with HttpLayerRouter.addHttpApi for composing routes at the server level.
 * Note: No prefix here - composed at app level with AppApi.
 */
export class TodoApi extends HttpApi.make('todo-api').add(TodoApiGroup) {}
