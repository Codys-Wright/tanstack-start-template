import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/responses')({
  component: function ResponsesPage() {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Responses</h1>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Responses content will go here</p>
        </div>
      </div>
    );
  },
});
