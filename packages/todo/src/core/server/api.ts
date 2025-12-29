import { TodoApiGroup } from '../../features/todo/domain';
import * as HttpApi from '@effect/platform/HttpApi';

export class TodoPackageApi extends HttpApi.make('todo-api').add(TodoApiGroup) {}
