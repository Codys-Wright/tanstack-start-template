/**
 * Lesson Edit Page
 *
 * Allows editing lesson content using the markdown editor.
 * Uses Effect Atom for state management and shadcn Sidebar.
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge, Button, Card, Sidebar, SidebarProvider } from '@shadcn';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Editor } from '@components/markdown-editor/editor';
import type { SerializedEditorState } from 'lexical';
import { CourseSidebar } from '../components/course-sidebar.js';
import { getLessonById, getSectionById } from '../data/course.js';

export const Route = createFileRoute('/lesson/$lessonId/edit')({
  component: LessonEditPageWrapper,
});

function LessonEditPageWrapper() {
  const params = Route.useParams() as { lessonId: string };
  const lessonId = params.lessonId;

  return (
    <SidebarProvider defaultOpen>
      <CourseSidebar currentLessonId={lessonId} />
      <Sidebar.Inset>
        <LessonEditPage lessonId={lessonId} />
      </Sidebar.Inset>
    </SidebarProvider>
  );
}

function LessonEditPage({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate();

  const lesson = getLessonById(lessonId);
  const section = lesson ? getSectionById(lesson.sectionId) : null;

  const [editorState, setEditorState] = useState<SerializedEditorState | undefined>(
    lesson?.editorState as SerializedEditorState | undefined,
  );
  const [hasChanges, setHasChanges] = useState(false);

  if (!lesson || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The lesson you're trying to edit doesn't exist.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    // In a real app, this would save to the server
    console.log('Saving lesson content:', editorState);

    // For now, just update the mock data
    if (lesson && editorState) {
      lesson.editorState = editorState;
    }

    setHasChanges(false);

    // Navigate back to the lesson view
    navigate({ to: '/lesson/$lessonId', params: { lessonId } });
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?',
      );
      if (!confirmed) return;
    }
    navigate({ to: '/lesson/$lessonId', params: { lessonId } });
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Course
                </Link>
                <span>/</span>
                <span>{section.title}</span>
                <span>/</span>
                <span>Edit</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Edit: {lesson.title}</h1>
              <Badge variant="secondary">{lesson.type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="mb-8">
          {lesson.type === 'text' || lesson.type === 'assignment' ? (
            <Editor
              editorSerializedState={editorState}
              initialMarkdown={!editorState ? lesson.mdxContent : undefined}
              onSerializedChange={(newState) => {
                setEditorState(newState);
                setHasChanges(true);
              }}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                The markdown editor is only available for text and assignment lessons.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This lesson is of type: <strong>{lesson.type}</strong>
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
