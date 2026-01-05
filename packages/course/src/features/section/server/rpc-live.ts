import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { SectionRpc } from '../domain/index.js';
import { SectionService } from './service.js';

export const SectionRpcLive = SectionRpc.toLayer(
  Effect.gen(function* () {
    const sections = yield* SectionService;

    return SectionRpc.of({
      section_getById: Effect.fn('SectionRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting section by id: ${id}`);
        return yield* sections.getById(id);
      }),

      section_listByCourse: Effect.fn('SectionRpc.listByCourse')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing sections for course: ${courseId}`);
        return yield* sections.listByCourse(courseId);
      }),

      section_create: Effect.fn('SectionRpc.create')(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating section: ${input.title}`);
        return yield* sections.create(input);
      }),

      section_update: Effect.fn('SectionRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating section: ${id}`);
        return yield* sections.update(id, input);
      }),

      section_reorder: Effect.fn('SectionRpc.reorder')(function* ({ sectionIds }) {
        yield* Effect.log(`[RPC] Reordering ${sectionIds.length} sections`);
        return yield* sections.reorder([...sectionIds]);
      }),

      section_delete: Effect.fn('SectionRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting section: ${id}`);
        return yield* sections.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(SectionService.Default));
