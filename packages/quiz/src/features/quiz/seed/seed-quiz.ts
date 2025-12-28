import { Version } from "@core/domain";
import type { UpsertQuestionPayload } from "../questions/question-rpc.js";
import type { UpsertRatingQuestion } from "../questions/question-types.js";
import artistTypeQuestions from "../questions/seed/data/artist-type-questions.json" with { type: "json" };
import { type UpsertQuizPayload } from "../quiz-rpc.js";
import artistTypeQuiz from "./data/artist-type-quiz.json" with { type: "json" };

/**
 * Creates the Artist Type quiz payload from seed data
 * This data can be used by external seed scripts to insert into the database
 */
export const getSeedPayload = (): UpsertQuizPayload => {
  // Transform the JSON questions into UpsertQuestionPayload format
  const questions: Array<UpsertQuestionPayload> = artistTypeQuestions.questions.map(
    (q: {
      order: number;
      description: string;
      data: { type: string; [key: string]: unknown };
    }) => ({
      order: q.order,
      title: q.description,
      subtitle: undefined,
      description: undefined,
      data: q.data as UpsertRatingQuestion,
      metadata: undefined,
    }),
  );

  return {
    title: artistTypeQuiz.title,
    subtitle: null,
    description: null,
    version: new Version({
      semver: artistTypeQuiz.version.semver,
      comment: artistTypeQuiz.version.comment,
    }),
    questions,
    metadata: {
      ...artistTypeQuiz.settings,
    },
  };
};
