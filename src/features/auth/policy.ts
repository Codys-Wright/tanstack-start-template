import * as HttpApiError from "@effect/platform/HttpApiError";
import * as RpcMiddleware from "@effect/rpc/RpcMiddleware";
import { Authentication } from "./domain/authentication.js";

/**
 * RPC middleware that validates authentication and provides Authentication context.
 * Used to protect RPC endpoints requiring authenticated users.
 */
export class AuthenticationRpcMiddleware extends RpcMiddleware.Tag<AuthenticationRpcMiddleware>()(
  "AuthenticationRpcMiddleware",
  {
    failure: HttpApiError.Unauthorized,
    provides: Authentication,
  },
) {}
