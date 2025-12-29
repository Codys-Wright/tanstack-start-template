import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/example/testing/testing1')({
  component: Testing1Page,
});

function Testing1Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Testing 1 Page</h2>
      <p className="text-muted-foreground">
        This is the nested testing1 page from @example virtual routes.
      </p>
      <div className="flex gap-4">
        <Link to="/example/testing" className="text-primary underline-offset-4 hover:underline">
          Back to Testing Index
        </Link>
        <Link to="/example" className="text-primary underline-offset-4 hover:underline">
          Back to Features
        </Link>
      </div>
    </div>
  );
}
