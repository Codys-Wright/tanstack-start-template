import { LandingPage } from '@/features/landing';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPage,
  ssr: false,
});
