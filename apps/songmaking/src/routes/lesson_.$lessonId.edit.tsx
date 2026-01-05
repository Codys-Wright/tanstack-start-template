/**
 * Lesson Edit Page
 *
 * Allows editing lesson parts using the markdown editor.
 * Shows a sidebar with all parts and allows editing individual text/assignment parts.
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { Badge, Button, Card, Sidebar, SidebarProvider, ScrollArea } from '@shadcn';
import {
  ArrowLeft,
  Save,
  X,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  FileDown,
} from 'lucide-react';
import { Editor } from '@components/markdown-editor/editor';
import { CourseSidebar } from '../components/course-sidebar.js';
import {
  getLessonById,
  getSectionById,
  getLessonParts,
  SONGMAKING_COURSE,
  type LessonPart,
  type LessonId,
} from '../data/course.js';

import { cn } from '@shadcn/lib/utils';

export const Route = createFileRoute('/lesson_/$lessonId/edit')({
  component: LessonEditPageWrapper,
});

// =============================================================================
// Helper Components
// =============================================================================

function PartTypeIcon({ type, className }: { type: LessonPart['type']; className?: string }) {
  const iconClass = cn('w-4 h-4', className);
  switch (type) {
    case 'video':
      return <PlayCircle className={iconClass} />;
    case 'text':
      return <FileText className={iconClass} />;
    case 'quiz':
      return <HelpCircle className={iconClass} />;
    case 'assignment':
      return <ClipboardList className={iconClass} />;
    case 'download':
      return <FileDown className={iconClass} />;
  }
}

function PartTypeBadge({ type }: { type: LessonPart['type'] }) {
  const colors: Record<LessonPart['type'], string> = {
    video: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    text: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    quiz: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    assignment: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    download: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  };

  return (
    <Badge variant="outline" className={cn('gap-1.5 px-2 py-0.5 text-xs', colors[type])}>
      <PartTypeIcon type={type} className="w-3 h-3" />
      {type}
    </Badge>
  );
}

// =============================================================================
// Part List Sidebar
// =============================================================================

function PartListSidebar({
  parts,
  currentPartIndex,
  onPartSelect,
  changedParts,
}: {
  parts: readonly LessonPart[];
  currentPartIndex: number;
  onPartSelect: (index: number) => void;
  changedParts: Set<string>;
}) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Lesson Parts</h3>
        <p className="text-xs text-muted-foreground mt-1">{parts.length} parts</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {parts.map((part, index) => {
            const isActive = index === currentPartIndex;
            const isEditable = part.type === 'text' || part.type === 'assignment';
            const hasChanges = changedParts.has(part.id);

            return (
              <button
                key={part.id}
                onClick={() => onPartSelect(index)}
                disabled={!isEditable}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : isEditable
                      ? 'hover:bg-muted text-foreground'
                      : 'text-muted-foreground cursor-not-allowed opacity-60',
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/20 text-muted-foreground',
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{part.title}</span>
                    {hasChanges && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <PartTypeBadge type={part.type} />
                    <span className="text-xs text-muted-foreground">{part.durationMinutes}m</span>
                  </div>
                  {!isEditable && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Not editable</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// =============================================================================
// Main Components
// =============================================================================

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

  // Cast lessonId to branded type for lookup functions
  const lesson = getLessonById(lessonId as LessonId);
  const section = lesson ? getSectionById(lesson.sectionId) : null;
  const parts = lesson ? getLessonParts(lesson.id) : [];

  // Track current part being edited
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  // Track changes per part (partId -> markdown content)
  const changesRef = useRef<Map<string, string>>(new Map());
  const [changedParts, setChangedParts] = useState<Set<string>>(new Set());

  const currentPart = parts[currentPartIndex];
  const isEditable = currentPart?.type === 'text' || currentPart?.type === 'assignment';

  // Get initial content for current part
  const getInitialMarkdown = (part: LessonPart | undefined) => {
    if (!part) return '';
    // Check if we have unsaved changes for this part
    const saved = changesRef.current.get(part.id);
    if (saved !== undefined) return saved;
    return part.mdxContent ?? '';
  };

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
    // Collect all changes
    const allChanges = Array.from(changesRef.current.entries());

    if (allChanges.length === 0) {
      console.log('No changes to save');
      return;
    }

    // Log changes (in production, this would be an API call)
    console.log('Saving lesson parts:', allChanges);

    // For now, just log and navigate back
    // In production: await savePartChanges(lessonId, allChanges);

    setChangedParts(new Set());
    changesRef.current.clear();

    // Navigate back to the lesson view
    navigate({ to: '/lesson/$lessonId', params: { lessonId } });
  };

  const handleCancel = () => {
    if (changedParts.size > 0) {
      const confirmed = window.confirm(
        `You have unsaved changes in ${changedParts.size} part(s). Are you sure you want to cancel?`,
      );
      if (!confirmed) return;
    }
    navigate({ to: '/lesson/$lessonId', params: { lessonId } });
  };

  const handlePartChange = (markdown: string) => {
    if (!currentPart) return;

    // Store the change
    changesRef.current.set(currentPart.id, markdown);

    // Track which parts have changes
    setChangedParts((prev) => {
      const next = new Set(prev);
      next.add(currentPart.id);
      return next;
    });
  };

  const handlePartSelect = (index: number) => {
    const part = parts[index];
    if (part && (part.type === 'text' || part.type === 'assignment')) {
      setCurrentPartIndex(index);
    }
  };

  // Find first editable part if current isn't editable
  const firstEditableIndex = parts.findIndex((p) => p.type === 'text' || p.type === 'assignment');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              {SONGMAKING_COURSE.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="truncate">{section.title}</span>
            <ChevronRight className="w-4 h-4" />
            <Link
              to="/lesson/$lessonId"
              params={{ lessonId }}
              className="hover:text-foreground transition-colors"
            >
              {lesson.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Edit</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold">
                {currentPart ? currentPart.title : lesson.title}
              </h1>
              {currentPart && <PartTypeBadge type={currentPart.type} />}
              {changedParts.size > 0 && (
                <Badge variant="secondary" className="gap-1.5">
                  {changedParts.size} unsaved change
                  {changedParts.size > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={changedParts.size === 0}>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Part Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Part List Sidebar */}
        <PartListSidebar
          parts={parts}
          currentPartIndex={currentPartIndex}
          onPartSelect={handlePartSelect}
          changedParts={changedParts}
        />

        {/* Editor Area */}
        <div className="flex-1 min-h-0">
          {currentPart && isEditable ? (
            <Editor
              key={currentPart.id}
              initialMarkdown={getInitialMarkdown(currentPart)}
              onMarkdownChange={handlePartChange}
            />
          ) : currentPart ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <PartTypeIcon type={currentPart.type} className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{currentPart.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {currentPart.type === 'video' &&
                    'Video content is edited through the video upload interface.'}
                  {currentPart.type === 'quiz' &&
                    'Quiz content is edited through the quiz builder.'}
                  {currentPart.type === 'download' &&
                    'Download resources are managed in the file manager.'}
                </p>
                {firstEditableIndex >= 0 && (
                  <Button variant="outline" onClick={() => handlePartSelect(firstEditableIndex)}>
                    Edit Text Content
                  </Button>
                )}
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No parts available for this lesson.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
