import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/quiz-editor')({
  component: function AdminQuizEditorPage() {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Quiz Editor</h1>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Quiz editor content will go here</p>
        </div>
      </div>
    );
  },
});
