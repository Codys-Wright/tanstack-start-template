import { RpcProtocol } from "@core/client/rpc-config";
import { AtomRpc } from "@effect-atom/atom-react";
import { TodosRpc } from "../domain/index.js";

/**
 * TodosClient - RPC client for the Todos feature.
 *
 * Provides:
 * - TodosClient.query("todos_list", ...) - for read queries
 * - TodosClient.mutation("todos_create") - for mutations
 * - TodosClient.runtime - for custom atoms
 * - TodosClient.layer - for Effect services
 * - TodosClient (as Context.Tag) - yields the raw RPC client
 */
export class TodosClient extends AtomRpc.Tag<TodosClient>()("@todo/Client", {
  group: TodosRpc,
  protocol: RpcProtocol,
}) {}
