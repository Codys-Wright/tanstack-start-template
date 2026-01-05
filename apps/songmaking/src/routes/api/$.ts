import { createFileRoute } from '@tanstack/react-router';
import { effectHandler } from '../../features/core/server/index.js';

export const Route = createFileRoute('/api/$' as any)({
  server: {
    handlers: {
      GET: effectHandler,
      POST: effectHandler,
      PUT: effectHandler,
      PATCH: effectHandler,
      DELETE: effectHandler,
      OPTIONS: effectHandler,
    },
  },
});
