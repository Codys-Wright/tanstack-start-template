import { Arbitrary, FastCheck } from "effect";
import { UpsertQuizPayload } from "../quiz-rpc.js";

/**
 * Generate fake quiz data using Arbitrary.make()
 * @param count - Number of quizzes to generate (defaults to 1)
 * @returns Single quiz if count is 1, array of quizzes if count > 1
 */
export function generate(count?: number): UpsertQuizPayload | Array<UpsertQuizPayload> {
  const actualCount = count ?? 1;
  const quizArb = Arbitrary.make(UpsertQuizPayload);
  const quizzes = FastCheck.sample(quizArb, actualCount);

  if (actualCount === 1) {
    const firstQuiz = quizzes[0];
    if (firstQuiz === undefined) {
      throw new Error("Failed to generate quiz");
    }
    return firstQuiz;
  }

  return quizzes;
}
