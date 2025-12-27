import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as Layer from "effect/Layer";

declare const window: { location: { origin: string } } | undefined;

/**
 * Get the base URL for API requests.
 * Uses window.location.origin on client, falls back to localhost on server.
 */
export const getBaseUrl = (): string =>
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

/**
 * Creates an RPC configuration layer for a given path.
 * Use this to create the RPC layer with a custom endpoint path.
 *
 * @param rpcPath - The path to the RPC endpoint (e.g., "/api/rpc")
 * @returns A layer providing RPC client configuration
 */
export const makeRpcConfigLayer = (rpcPath: string) =>
  RpcClient.layerProtocolHttp({
    url: getBaseUrl() + rpcPath,
  }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

/**
 * Default RPC protocol layer for all RPC clients.
 * Uses the standard /api/rpc endpoint.
 */
export const RpcProtocol = makeRpcConfigLayer("/api/rpc");
