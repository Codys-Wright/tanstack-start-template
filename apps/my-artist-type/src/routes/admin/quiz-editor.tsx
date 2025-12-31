import { QuizEditorLayout } from '@quiz';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/quiz-editor')({
  component: QuizEditorLayout,
});
