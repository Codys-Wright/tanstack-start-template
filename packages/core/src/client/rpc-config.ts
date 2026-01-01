import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as RpcClient from '@effect/rpc/RpcClient';
import * as RpcSerialization from '@effect/rpc/RpcSerialization';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

declare const window: { location: { origin: string } } | undefined;

/**
 * Get the base URL for API requests.
 * Uses window.location.origin on client, falls back to environment variable or localhost on server.
 */
export const getBaseUrl = (): string => {
  // Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side: use environment variable or default
  // During SSR, we need to use the actual server URL
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
};

/**
 * Creates an RPC configuration layer for a given path.
 * Use this to create the RPC layer with a custom endpoint path.
 *
 * NOTE: The URL is evaluated lazily via Effect.sync to ensure
 * it picks up the correct environment at runtime.
 *
 * @param rpcPath - The path to the RPC endpoint (e.g., "/api/rpc")
 * @returns A layer providing RPC client configuration
 */
export const makeRpcConfigLayer = (rpcPath: string) =>
  Layer.unwrapEffect(
    Effect.sync(() =>
      RpcClient.layerProtocolHttp({
        url: getBaseUrl() + rpcPath,
      }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson])),
    ),
  );

/**
 * Default RPC protocol layer for all RPC clients.
 * Uses the standard /api/rpc endpoint.
 */
export const RpcProtocol = makeRpcConfigLayer('/api/rpc');
