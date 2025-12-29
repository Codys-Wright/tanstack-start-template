// Quiz Domain Schema
// This defines the structure for quiz entities

import { NullOrFromFallible, Version } from '@core/domain';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import { faker } from '@faker-js/faker';
import * as Schema from 'effect/Schema';
import { Question, UpsertQuestionPayload } from '../questions/schema.js';

// 1) Create a branded ID type for the entity
export const QuizId = Schema.UUID.pipe(Schema.brand('QuizId'));
export type QuizId = typeof QuizId.Type;

// 2) Define metadata schemas
export class QuizMetadata extends Schema.Class<QuizMetadata>('QuizMetadata')({
  tags: Schema.optional(Schema.Array(Schema.String)),
  customFields: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

export class QuizSettings extends Schema.Class<QuizSettings>('QuizSettings')({
  customFields: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

// 3) Define the Quiz entity schema
export class Quiz extends Schema.Class<Quiz>('Quiz')({
  id: QuizId,
  version: Schema.parseJson(Version),
  title: Schema.String,
  subtitle: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  questions: Schema.optional(Schema.parseJson(Schema.Array(Question))),
  settings: Schema.optional(Schema.NullOr(Schema.parseJson(NullOrFromFallible(QuizSettings)))),
  isPublished: Schema.Boolean,
  isTemp: Schema.Boolean,
  metadata: Schema.optional(Schema.NullOr(Schema.parseJson(NullOrFromFallible(QuizMetadata)))),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  deletedAt: Schema.NullOr(Schema.DateTimeUtc),
}) {}

// 4) Define the upsert payload schema
export class UpsertQuizPayload extends Schema.Class<UpsertQuizPayload>('UpsertQuizPayload')({
  id: Schema.optional(QuizId),
  version: Schema.optional(Version).pipe(
    Schema.withDefaults({
      constructor: () => new Version({ semver: '1.0.0', comment: 'Initial version' }),
      decoding: () => new Version({ semver: '1.0.0', comment: 'Initial version' }),
    }),
  ),
  title: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => 'title is required' }),
    Schema.maxLength(30, {
      message: () => 'Title must be at most 30 characters long',
    }),
  ).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(3).slice(0, 30)),
  }),
  subtitle: Schema.optional(
    Schema.NullOr(
      Schema.Trim.pipe(
        Schema.nonEmptyString({ message: () => 'subtitle is required' }),
        Schema.maxLength(100, {
          message: () => 'subtitle must be at most 30 characters long',
        }),
      ).annotations({
        arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.sentence().slice(0, 100)),
      }),
    ),
  ),
  description: Schema.optional(
    Schema.NullOr(
      Schema.Trim.pipe(
        Schema.nonEmptyString({ message: () => 'description is required' }),
        Schema.maxLength(1_000, {
          message: () => 'Description must be at most 1,000 characters long',
        }),
      ).annotations({
        arbitrary: () => (fc) =>
          fc.constant(null).map(() => faker.lorem.paragraphs(2).slice(0, 1000)),
      }),
    ),
  ),
  questions: Schema.optional(Schema.Array(UpsertQuestionPayload)),
  settings: Schema.optional(Schema.NullOr(Schema.parseJson(NullOrFromFallible(QuizSettings)))),
  isPublished: Schema.optional(Schema.Boolean),
  isTemp: Schema.optional(Schema.Boolean),
  metadata: Schema.optional(QuizMetadata),
}) {}

// 5) Define errors
export class QuizNotFoundError extends Schema.TaggedError<QuizNotFoundError>('QuizNotFoundError')(
  'QuizNotFoundError',
  { id: QuizId },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Quiz with id ${this.id} not found`;
  }
}
