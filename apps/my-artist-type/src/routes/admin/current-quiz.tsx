import { CurrentQuizPage } from '@quiz';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/current-quiz')({
  component: CurrentQuizPage,
});
