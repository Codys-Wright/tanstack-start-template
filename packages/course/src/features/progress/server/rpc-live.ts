import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type { CourseProgressSummary } from '../domain/index.js';
import { ProgressRpc } from '../domain/index.js';
import { ProgressService } from './service.js';

export const ProgressRpcLive = ProgressRpc.toLayer(
  Effect.gen(function* () {
    const progress = yield* ProgressService;

    return ProgressRpc.of({
      progress_getById: Effect.fn('ProgressRpc.getById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting progress by id: ${id}`);
        return yield* progress.getById(id);
      }),

      progress_getByLesson: Effect.fn('ProgressRpc.getByLesson')(function* ({ lessonId }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Getting progress for lesson: ${lessonId}`);
        return yield* progress.getByUserAndLesson(auth.userId, lessonId);
      }),

      progress_listByEnrollment: Effect.fn('ProgressRpc.listByEnrollment')(function* ({
        enrollmentId,
      }) {
        yield* Effect.log(`[RPC] Listing progress for enrollment: ${enrollmentId}`);
        return yield* progress.listByEnrollment(enrollmentId);
      }),

      progress_listByCourse: Effect.fn('ProgressRpc.listByCourse')(function* ({ courseId }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing progress for course: ${courseId}`);
        return yield* progress.listByUserAndCourse(auth.userId, courseId);
      }),

      progress_getCourseSummary: Effect.fn('ProgressRpc.getCourseSummary')(function* ({
        courseId,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Getting course summary for: ${courseId}`);
        const progressList = yield* progress.listByUserAndCourse(auth.userId, courseId);
        const completed = progressList.filter((p) => p.status === 'completed').length;
        const inProgress = progressList.filter((p) => p.status === 'in_progress').length;
        const total = progressList.length;
        return {
          userId: auth.userId,
          courseId,
          totalLessons: total,
          completedLessons: completed,
          inProgressLessons: inProgress,
          progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
          isCompleted: total > 0 && completed === total,
        } as CourseProgressSummary;
      }),

      progress_countCompleted: Effect.fn('ProgressRpc.countCompleted')(function* ({
        enrollmentId,
      }) {
        yield* Effect.log(`[RPC] Counting completed for enrollment: ${enrollmentId}`);
        return yield* progress.countCompleted(enrollmentId);
      }),

      progress_startLesson: Effect.fn('ProgressRpc.startLesson')(function* ({
        lessonId,
        enrollmentId,
      }) {
        yield* Effect.log(`[RPC] Starting lesson: ${lessonId}`);
        const auth = yield* AuthContext;
        return yield* progress.startLessonForUser(auth.userId, lessonId, enrollmentId);
      }),

      progress_updateProgress: Effect.fn('ProgressRpc.updateProgress')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating progress: ${id}`);
        return yield* progress.updateProgress(id, input);
      }),

      progress_markCompleted: Effect.fn('ProgressRpc.markCompleted')(function* ({ id }) {
        yield* Effect.log(`[RPC] Marking progress completed: ${id}`);
        return yield* progress.markCompleted(id);
      }),

      progress_markLessonComplete: Effect.fn('ProgressRpc.markLessonComplete')(function* ({
        lessonId,
      }) {
        yield* Effect.log(`[RPC] Marking lesson complete: ${lessonId}`);
        const auth = yield* AuthContext;
        return yield* progress.markLessonCompleteForUser(auth.userId, lessonId);
      }),
    });
  }),
).pipe(Layer.provide(ProgressService.Default));
