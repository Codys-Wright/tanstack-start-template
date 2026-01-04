import { LandingPage } from '@my-artist-type/features/landing';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPage,
});
