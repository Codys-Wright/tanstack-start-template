import { faker } from "@faker-js/faker";
import { Schema as S } from "effect";

const RatingQuestionData = S.Struct({
  type: S.Literal("rating"),
  minRating: S.Number.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.number.int({ min: 0, max: 2 })),
  }),
  maxRating: S.Number.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.number.int({ min: 5, max: 10 })),
  }),
  minLabel: S.String.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.word.adjective()),
  }),
  maxLabel: S.String.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.word.adjective()),
  }),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Rating Question",
      description: "A question with a numeric rating scale",
    },
  }),
);

const UpsertRatingQuestionData = S.Struct({
  type: S.Literal("rating"),
  minRating: S.Number.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.number.int({ min: 0, max: 2 })),
  }),
  maxRating: S.Number.annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.number.int({ min: 5, max: 10 })),
  }),
  minLabel: S.Trim.pipe(
    S.nonEmptyString({
      message: () => "Minimum label cannot be empty",
    }),
  ).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.word.adjective()),
  }),
  maxLabel: S.Trim.pipe(
    S.nonEmptyString({
      message: () => "Maximum label cannot be empty",
    }),
  ).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.word.adjective()),
  }),
}).pipe(
  S.filter((data) => data.minRating <= data.maxRating, {
    message: () => "minimum rating cannot be greater than maximum rating",
    jsonSchema: { minRating: { type: "number" }, maxRating: { type: "number" } },
  }),
  S.annotations({
    jsonSchema: {
      title: "Upsert Rating Question",
      description: "Data for creating/updating a rating question",
    },
  }),
);

const MultipleChoiceQuestionData = S.Struct({
  type: S.Literal("multiple-choice"),
  choices: S.Array(
    S.String.annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(2)),
    }),
  ).annotations({
    arbitrary: () => (fc) =>
      fc
        .constant(null)
        .map(() =>
          Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => faker.lorem.words(2)),
        ),
  }),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Multiple Choice Question",
      description: "A question with multiple choice options",
    },
  }),
);

const UpsertMultipleChoiceQuestionData = S.Struct({
  type: S.Literal("multiple-choice"),
  choices: S.Array(
    S.String.annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(2)),
    }),
  ).annotations({
    arbitrary: () => (fc) =>
      fc
        .constant(null)
        .map(() =>
          Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => faker.lorem.words(2)),
        ),
  }),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Upsert Multiple Choice Question",
      description: "Data for creating/updating a multiple choice question",
    },
  }),
);

const TextQuestionData = S.Struct({
  type: S.Literal("text"),
  placeholder: S.optional(
    S.String.annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(4)),
    }),
  ),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Text Question",
      description: "A free text input question",
    },
  }),
);

const UpsertTextQuestionData = S.Struct({
  type: S.Literal("text"),
  placeholder: S.optional(
    S.String.annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(4)),
    }),
  ),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Upsert Text Question",
      description: "Data for creating/updating a text question",
    },
  }),
);

const EmailQuestionData = S.Struct({
  type: S.Literal("email"),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Email Question",
      description: "An email input question",
    },
  }),
);

const UpsertEmailQuestionData = S.Struct({
  type: S.Literal("email"),
}).pipe(
  S.annotations({
    jsonSchema: {
      title: "Upsert Email Question",
      description: "Data for creating/updating an email question",
    },
  }),
);

// Union type for all question types
export const QuestionData = S.Union(
  RatingQuestionData,
  MultipleChoiceQuestionData,
  TextQuestionData,
  EmailQuestionData,
).pipe(
  S.annotations({
    jsonSchema: {
      title: "Question Data",
      description: "Union of all possible question data types",
      discriminator: { propertyName: "type" },
    },
  }),
);

export const UpsertQuestionData = S.Union(
  UpsertRatingQuestionData,
  UpsertMultipleChoiceQuestionData,
  UpsertTextQuestionData,
  UpsertEmailQuestionData,
).pipe(
  S.annotations({
    jsonSchema: {
      title: "Upsert Question Data",
      description: "Union of all possible question data types for create/update operations",
      discriminator: { propertyName: "type" },
    },
  }),
);

// Type aliases for easier usage
export type RatingQuestion = S.Schema.Type<typeof RatingQuestionData>;
export type UpsertRatingQuestion = S.Schema.Type<typeof UpsertRatingQuestionData>;
export type MultipleChoiceQuestion = S.Schema.Type<typeof MultipleChoiceQuestionData>;
export type TextQuestion = S.Schema.Type<typeof TextQuestionData>;
export type EmailQuestion = S.Schema.Type<typeof EmailQuestionData>;
export type QuestionData = S.Schema.Type<typeof QuestionData>;
