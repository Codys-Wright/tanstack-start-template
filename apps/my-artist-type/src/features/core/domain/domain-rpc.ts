import * as RpcGroup from "@effect/rpc/RpcGroup";
import { TodosRpc } from "@/features/todo/domain";

export class DomainRpc extends RpcGroup.make().merge(TodosRpc) {}
