import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { LessonRpc } from '../domain/index.js';
import { LessonService } from './service.js';

export const LessonRpcLive = LessonRpc.toLayer(
  Effect.gen(function* () {
    const lessons = yield* LessonService;

    return LessonRpc.of({
      lesson_getById: Effect.fn('LessonRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting lesson by id: ${id}`);
        return yield* lessons.getById(id);
      }),

      lesson_listBySection: Effect.fn('LessonRpc.listBySection')(function* ({ sectionId }) {
        yield* Effect.log(`[RPC] Listing lessons for section: ${sectionId}`);
        return yield* lessons.listBySection(sectionId);
      }),

      lesson_listByCourse: Effect.fn('LessonRpc.listByCourse')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing lessons for course: ${courseId}`);
        return yield* lessons.listByCourse(courseId);
      }),

      lesson_listFreePreview: Effect.fn('LessonRpc.listFreePreview')(function* ({ courseId }) {
        yield* Effect.log(`[RPC] Listing free preview lessons for course: ${courseId}`);
        return yield* lessons.listFreePreview(courseId);
      }),

      lesson_create: Effect.fn('LessonRpc.create')(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating lesson: ${input.title}`);
        return yield* lessons.create(input);
      }),

      lesson_update: Effect.fn('LessonRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating lesson: ${id}`);
        return yield* lessons.update(id, input);
      }),

      lesson_reorder: Effect.fn('LessonRpc.reorder')(function* ({ lessonIds }) {
        yield* Effect.log(`[RPC] Reordering ${lessonIds.length} lessons`);
        return yield* lessons.reorder([...lessonIds]);
      }),

      lesson_delete: Effect.fn('LessonRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting lesson: ${id}`);
        return yield* lessons.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(LessonService.Default));
