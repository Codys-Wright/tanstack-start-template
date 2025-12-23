import * as HttpApi from "@effect/platform/HttpApi";
import { TodosApiGroup } from "@/features/todo/domain";

export class DomainApi extends HttpApi.make("api")
  .add(TodosApiGroup)
  .prefix("/api") {}
