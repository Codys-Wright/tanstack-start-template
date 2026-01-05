import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import {
  CreateInstructorInput,
  InstructorProfile,
  InstructorId,
  UpdateInstructorInput,
} from '../domain/index.js';
import { InstructorClient } from './client.js';

const InstructorsSchema = S.Array(InstructorProfile);

type InstructorsCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly instructor: InstructorProfile };
  Delete: { readonly id: InstructorId };
}>;

/**
 * All instructors atom with cache updates.
 */
export const instructorsAtom = (() => {
  const remoteAtom = InstructorClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* InstructorClient;
        return yield* client('instructor_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@course/instructors',
        schema: Result.Schema({
          success: InstructorsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: InstructorsCacheUpdate) => {
        const current = ctx.get(instructorsAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (i) => i.id === update.instructor.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.instructor),
                onSome: (index) => Arr.replace(current.value, index, update.instructor),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (i) => i.id !== update.id);
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
 * Approved instructors (for public display)
 */
export const approvedInstructorsAtom = InstructorClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* InstructorClient;
      return yield* client('instructor_listApproved', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/instructors/approved',
      schema: Result.Schema({
        success: InstructorsSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

/**
 * Current user's instructor profile (if they have one)
 */
export const myInstructorProfileAtom = InstructorClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* InstructorClient;
      return yield* client('instructor_getMyProfile', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/instructors/my-profile',
      schema: Result.Schema({
        success: S.NullOr(InstructorProfile),
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

// ============================================================================
// Mutation Atoms
// ============================================================================

export const applyAsInstructorAtom = InstructorClient.runtime.fn<CreateInstructorInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* InstructorClient;
    const result = yield* client('instructor_apply', { input });
    get.set(instructorsAtom, { _tag: 'Upsert', instructor: result });
    return result;
  }),
);

export const updateInstructorAtom = InstructorClient.runtime.fn<{
  readonly id: InstructorId;
  readonly input: UpdateInstructorInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const client = yield* InstructorClient;
    const result = yield* client('instructor_update', { id, input });
    get.set(instructorsAtom, { _tag: 'Upsert', instructor: result });
    return result;
  }),
);
