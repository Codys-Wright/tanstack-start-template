import { createFileRoute } from '@tanstack/react-router';
import { ResponsesPage } from '@quiz';

/**
 * Responses route - displays all quiz responses
 * Shows a list/table of all submitted quiz responses
 */
export const Route = createFileRoute('/responses')({
  component: ResponsesPage,
});
