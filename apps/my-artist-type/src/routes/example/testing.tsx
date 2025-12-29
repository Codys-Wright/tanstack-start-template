import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/example/testing')({
  component: TestingLayout,
});

function TestingLayout() {
  return (
    <main className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Testing Area</h1>
        <p className="text-muted-foreground">
          This is the testing layout from the @example package virtual routes.
        </p>
      </div>
      <Outlet />
    </main>
  );
}
