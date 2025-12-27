import { TodosApiGroup } from "@todo";
import * as HttpApi from "@effect/platform/HttpApi";
import * as OpenApi from "@effect/platform/OpenApi";

export class DomainApi extends HttpApi.make("api")
  .add(TodosApiGroup)
  .prefix("/api")
  .annotateContext(
    OpenApi.annotations({
      title: "TanStack Start API",
      description: "API for the TanStack Start application",
      version: "1.0.0",
    })
  ) {}
