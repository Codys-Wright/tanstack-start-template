import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { CourseId } from '../../course/domain/schema.js';
import { CreateSectionInput, Section, SectionId, UpdateSectionInput } from '../domain/index.js';
import { SectionClient } from './client.js';

const SectionsSchema = S.Array(Section);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Sections for a specific course (parameterized atom family)
 */
export const sectionsByCourseAtomFamily = (courseId: CourseId) =>
  SectionClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* SectionClient;
        return yield* client('section_listByCourse', { courseId });
      }),
    )
    .pipe(
      serializable({
        key: `@course/sections/${courseId}`,
        schema: Result.Schema({
          success: SectionsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Create a new section
 */
export const createSectionAtom = SectionClient.runtime.fn<CreateSectionInput>()(
  Effect.fnUntraced(function* (input) {
    const client = yield* SectionClient;
    return yield* client('section_create', { input });
  }),
);

/**
 * Update an existing section
 */
export const updateSectionAtom = SectionClient.runtime.fn<{
  readonly id: SectionId;
  readonly input: UpdateSectionInput;
}>()(
  Effect.fnUntraced(function* ({ id, input }) {
    const client = yield* SectionClient;
    return yield* client('section_update', { id, input });
  }),
);

/**
 * Delete a section
 */
export const deleteSectionAtom = SectionClient.runtime.fn<SectionId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* SectionClient;
    yield* client('section_delete', { id });
  }),
);
