import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import type { Quiz } from '../schema.js';
import { Button, Separator } from '@ui/shadcn';
import React from 'react';
import { QuizItem } from './quiz-item.js';
import { UpsertQuizForm } from './upsert-quiz-form.js';
import { quizzesAtom } from '../atoms.js';

const SuccessView: React.FC<{ quizzes: ReadonlyArray<Quiz> }> = ({ quizzes }) => {
  return (
    <main className="flex flex-col gap-2 ">
      <UpsertQuizForm />

      <Separator />

      <section className="flex flex-col gap-2">
        {quizzes.map((quiz) => (
          <QuizItem key={quiz.id} quiz={quiz} />
        ))}
      </section>
    </main>
  );
};

const ErrorView: React.FC = () => {
  const refresh = useAtomRefresh(quizzesAtom.remote);

  return (
    <div className="flex flex-col gap-2">
      <p>Something went wrong...</p>
      <Button onClick={refresh}>Retry</Button>
    </div>
  );
};

export const QuizPage: React.FC = () => {
  const quizzesResult = useAtomValue(quizzesAtom);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {Result.builder(quizzesResult)
        .onFailure(() => <ErrorView />)
        .onSuccess((quizzes) => <SuccessView quizzes={quizzes} />)
        .onWaiting((result) => Result.isInitial(result) && result.waiting && <p>Loading...</p>)
        .orNull()}
    </div>
  );
};
