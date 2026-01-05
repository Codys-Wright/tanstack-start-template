import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { CourseRpc } from '../domain/index.js';
import { CourseService } from './service.js';

export const CourseRpcLive = CourseRpc.toLayer(
  Effect.gen(function* () {
    const courses = yield* CourseService;

    return CourseRpc.of({
      course_list: Effect.fn('CourseRpc.list')(function* () {
        yield* Effect.log('[RPC] Listing all courses');
        return yield* courses.list();
      }),

      course_listPublished: Effect.fn('CourseRpc.listPublished')(function* () {
        yield* Effect.log('[RPC] Listing published courses');
        return yield* courses.listPublished();
      }),

      course_getById: Effect.fn('CourseRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting course by id: ${id}`);
        return yield* courses.getById(id);
      }),

      course_getBySlug: Effect.fn('CourseRpc.getBySlug')(function* ({ slug }) {
        yield* Effect.log(`[RPC] Getting course by slug: ${slug}`);
        return yield* courses.getBySlug(slug);
      }),

      course_listByInstructor: Effect.fn('CourseRpc.listByInstructor')(function* ({
        instructorId,
      }) {
        yield* Effect.log(`[RPC] Listing courses by instructor: ${instructorId}`);
        return yield* courses.listByInstructor(instructorId);
      }),

      course_listByCategory: Effect.fn('CourseRpc.listByCategory')(function* ({ categoryId }) {
        yield* Effect.log(`[RPC] Listing courses by category: ${categoryId}`);
        return yield* courses.listByCategory(categoryId);
      }),

      course_listMyCreatedCourses: Effect.fn('CourseRpc.listMyCreatedCourses')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing courses created by user: ${auth.userId}`);
        return yield* courses.listByUserInstructor(auth.userId);
      }),

      course_create: Effect.fn('CourseRpc.create')(function* ({ input }) {
        yield* Effect.log(`[RPC] Creating course: ${input.title}`);
        return yield* courses.create(input);
      }),

      course_update: Effect.fn('CourseRpc.update')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating course: ${id}`);
        return yield* courses.update(id, input);
      }),

      course_publish: Effect.fn('CourseRpc.publish')(function* ({ id }) {
        yield* Effect.log(`[RPC] Publishing course: ${id}`);
        return yield* courses.publish(id);
      }),

      course_archive: Effect.fn('CourseRpc.archive')(function* ({ id }) {
        yield* Effect.log(`[RPC] Archiving course: ${id}`);
        return yield* courses.archive(id);
      }),

      course_delete: Effect.fn('CourseRpc.delete')(function* ({ id }) {
        yield* Effect.log(`[RPC] Deleting course: ${id}`);
        return yield* courses.delete(id);
      }),
    });
  }),
).pipe(Layer.provide(CourseService.Default));
