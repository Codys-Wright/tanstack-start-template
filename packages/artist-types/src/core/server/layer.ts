/**
 * ArtistTypeRpcLive - RPC handlers layer for the artist-types package.
 *
 * This re-exports the RPC layer from the server module for easy access.
 *
 * Usage in app server:
 * ```ts
 * import { ArtistTypeRpcLive } from "@artist-types/server";
 *
 * const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
 *   Layer.provide(ArtistTypeRpcLive)
 * );
 * ```
 */

export { ArtistTypeRpcLive } from '../../server/rpc-live.js';
