/**
 * ArtistTypeRpcLive - RPC handler layer for artist type operations.
 *
 * Each handler uses Effect.fn with a span name for tracing.
 * The span hierarchy will be:
 *   rpc.artistType_list (from RpcTracer middleware)
 *     -> ArtistTypeRpc.list (this handler)
 *         -> ArtistTypeService.list (service layer)
 */

import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ArtistTypeRpc } from '../domain/index.js';
import type { ArtistTypeId } from '../domain/schema.js';
import { ArtistTypeService } from './live-service.js';

export const ArtistTypeRpcLive = ArtistTypeRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* ArtistTypeService;

    return ArtistTypeRpc.of({
      artistType_list: Effect.fn('ArtistTypeRpc.list')(function* () {
        yield* Effect.log(`[RPC] Listing artist types`);
        return yield* service.list();
      }),

      artistType_getById: Effect.fn('ArtistTypeRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting artist type by ID: ${id}`);
        return yield* service.getById(id as ArtistTypeId);
      }),

      artistType_getBySlug: Effect.fn('ArtistTypeRpc.getBySlug')(function* ({ slug }) {
        yield* Effect.log(`[RPC] Getting artist type by slug: ${slug}`);
        return yield* service.getBySlug(slug);
      }),
    });
  }),
).pipe(Layer.provide(ArtistTypeService.Default));
