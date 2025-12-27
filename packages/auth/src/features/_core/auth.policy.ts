import * as HttpApiError from "@effect/platform/HttpApiError";
import * as RpcMiddleware from "@effect/rpc/RpcMiddleware";
import { AuthContext } from "./auth.context";

/**
 * RPC middleware that validates authentication and provides AuthContext.
 * Used to protect RPC endpoints requiring authenticated users.
 */
export class RpcAuthenticationMiddleware extends RpcMiddleware.Tag<RpcAuthenticationMiddleware>()(
  "RpcAuthenticationMiddleware",
  {
    failure: HttpApiError.Unauthorized,
    provides: AuthContext,
  }
) {}
