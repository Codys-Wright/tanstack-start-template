import { TodosRpc } from "@todo";
import * as RpcGroup from "@effect/rpc/RpcGroup";

export class DomainRpc extends RpcGroup.make().merge(TodosRpc) {}
