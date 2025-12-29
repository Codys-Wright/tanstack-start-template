import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/responses/$responseId/analysis')({
  component: function AdminResponseAnalysisPage() {
    const { responseId } = useParams({
      from: '/admin/responses/$responseId/analysis',
    });

    return (
      <div className="min-h-screen p-8">
        <h2 className="text-2xl font-bold mb-4">Response Analysis</h2>
        <p className="text-muted-foreground mb-6">
          Deep dive into analysis results for response: {responseId}
        </p>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Response analysis content will go here</p>
        </div>
      </div>
    );
  },
});
