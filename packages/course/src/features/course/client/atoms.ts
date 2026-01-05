import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import { Course, CourseId, CreateCourseInput, UpdateCourseInput } from '../domain/index.js';
import { CourseClient } from './client.js';

const CoursesSchema = S.Array(Course);

type CoursesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly course: Course };
  Delete: { readonly id: CourseId };
}>;

/**
 * Published courses atom (public catalog)
 */
export const publishedCoursesAtom = (() => {
  const remoteAtom = CourseClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* CourseClient;
        return yield* client('course_listPublished', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@course/courses/published',
        schema: Result.Schema({
          success: CoursesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: CoursesCacheUpdate) => {
        const current = ctx.get(publishedCoursesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              // Only add if published
              if (update.course.status !== 'published') {
                return Arr.filter(current.value, (c) => c.id !== update.course.id);
              }
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (c) => c.id === update.course.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.course),
                onSome: (index) => Arr.replace(current.value, index, update.course),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (c) => c.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

/**
 * My created courses (for instructors)
 */
export const myCreatedCoursesAtom = CourseClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* CourseClient;
      return yield* client('course_listMyCreatedCourses', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/courses/my-created',
      schema: Result.Schema({
        success: CoursesSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

// ============================================================================
// Mutation Atoms
// ============================================================================

export const createCourseAtom = CourseClient.runtime.fn<CreateCourseInput>()(
  Effect.fnUntraced(function* (input) {
    const client = yield* CourseClient;
    return yield* client('course_create', { input });
  }),
);

export const updateCourseAtom = CourseClient.runtime.fn<{
  readonly id: CourseId;
  readonly input: UpdateCourseInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* CourseClient;
    const result = yield* client('course_update', { id, input });
    get.set(publishedCoursesAtom, { _tag: 'Upsert', course: result });
    return result;
  }),
);

export const publishCourseAtom = CourseClient.runtime.fn<CourseId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* CourseClient;
    const result = yield* client('course_publish', { id });
    get.set(publishedCoursesAtom, { _tag: 'Upsert', course: result });
    return result;
  }),
);

export const archiveCourseAtom = CourseClient.runtime.fn<CourseId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* CourseClient;
    const result = yield* client('course_archive', { id });
    get.set(publishedCoursesAtom, { _tag: 'Delete', id });
    return result;
  }),
);
