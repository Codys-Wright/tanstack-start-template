/**
 * Lesson Page
 *
 * A polished lesson viewer with responsive layout, smooth animations,
 * and beautiful content rendering. Uses Effect Atom for state management.
 *
 * Lessons are composed of multiple LessonParts, allowing for sequences
 * like: text -> quiz -> text -> video, etc.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import * as Option from 'effect/Option';
import { Badge, Button, Card, ScrollArea, Sidebar, SidebarProvider, useSidebar } from '@shadcn';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  FileDown,
  BookOpen,
  ArrowLeft,
  Menu,
  Home,
  Music,
  Sparkles,
  Pencil,
  Circle,
} from 'lucide-react';
import { CourseSidebar } from '../components/course-sidebar.js';
import { type Lesson, type LessonPart, getLessonParts } from '../data/course.js';
import { Editor } from '@components/markdown-editor/editor';
import {
  courseAtom,
  currentLessonIdAtom,
  currentLessonAtom,
  currentSectionAtom,
  nextLessonAtom,
  previousLessonAtom,
  progressAtom,
} from '../features/course/client/course-atoms.js';
import { cn } from '@shadcn/lib/utils';
import * as React from 'react';

export const Route = createFileRoute('/lesson/$lessonId')({
  component: LessonPageWrapper,
});

// =============================================================================
// Helper Components
// =============================================================================

function PartTypeIcon({ type, className }: { type: LessonPart['type']; className?: string }) {
  const iconClass = cn('w-5 h-5', className);
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

function LessonTypeIcon({ type, className }: { type: Lesson['type']; className?: string }) {
  const iconClass = cn('w-5 h-5', className);
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

function LessonTypeBadge({ type }: { type: Lesson['type'] }) {
  const labels: Record<Lesson['type'], string> = {
    video: 'Video Lesson',
    text: 'Reading',
    quiz: 'Quiz',
    assignment: 'Assignment',
    download: 'Resources',
  };

  const colors: Record<Lesson['type'], string> = {
    video: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    text: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    quiz: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    assignment: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    download: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 px-2.5 py-1 text-xs font-medium', colors[type])}
    >
      <LessonTypeIcon type={type} className="w-3.5 h-3.5" />
      {labels[type]}
    </Badge>
  );
}

// =============================================================================
// Part Content Components
// =============================================================================

function PartVideoContent({ part }: { part: LessonPart }) {
  if (!part.videoContent) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border">
        <div className="text-center">
          <PlayCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Video not available</p>
        </div>
      </div>
    );
  }

  const { provider, videoId } = part.videoContent;

  if (provider === 'youtube') {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={part.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (provider === 'vimeo') {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <iframe
          className="w-full h-full"
          src={`https://player.vimeo.com/video/${videoId}`}
          title={part.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      <video className="w-full h-full" controls src={videoId}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function PartTextContent({ part }: { part: LessonPart }) {
  if (!part.mdxContent) {
    return (
      <div className="bg-muted rounded-xl p-8 text-center border">
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return <Editor initialMarkdown={part.mdxContent} readOnly />;
}

function PartQuizContent({ part }: { part: LessonPart }) {
  return (
    <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-500/5 to-transparent border-amber-500/20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{part.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Test your knowledge with this quiz. You need to score at least{' '}
        <span className="font-semibold text-foreground">{part.quizPassingScore ?? 70}%</span> to
        pass.
      </p>
      <Button size="lg" className="gap-2 h-12 px-8">
        <PlayCircle className="w-5 h-5" />
        Start Quiz
      </Button>
    </Card>
  );
}

function PartAssignmentContent({ part }: { part: LessonPart }) {
  return (
    <div>
      <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{part.title}</h3>
            <p className="text-sm text-muted-foreground">
              Complete this assignment to practice what you've learned
            </p>
          </div>
        </div>
      </Card>
      <PartTextContent part={part} />
    </div>
  );
}

function PartDownloadContent({ part }: { part: LessonPart }) {
  return (
    <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-cyan-500/5 to-transparent border-cyan-500/20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
        <FileDown className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{part.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Download the resources for this section
      </p>
      <Button size="lg" className="gap-2 h-12 px-8">
        <FileDown className="w-5 h-5" />
        Download Files
      </Button>
    </Card>
  );
}

/**
 * Renders a single lesson part based on its type
 */
function LessonPartContent({ part }: { part: LessonPart }) {
  switch (part.type) {
    case 'video':
      return <PartVideoContent part={part} />;
    case 'text':
      return <PartTextContent part={part} />;
    case 'quiz':
      return <PartQuizContent part={part} />;
    case 'assignment':
      return <PartAssignmentContent part={part} />;
    case 'download':
      return <PartDownloadContent part={part} />;
    default:
      return null;
  }
}

// =============================================================================
// Part Navigation Sidebar
// =============================================================================

function PartNavigationSidebar({
  parts,
  currentPartIndex,
  onPartSelect,
}: {
  parts: readonly LessonPart[];
  currentPartIndex: number;
  onPartSelect: (index: number) => void;
}) {
  if (parts.length <= 1) return null;

  return (
    <div className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Lesson Parts</h3>
        <nav className="space-y-1">
          {parts.map((part, index) => {
            const isActive = index === currentPartIndex;
            const isCompleted = index < currentPartIndex;

            return (
              <button
                key={part.id}
                onClick={() => onPartSelect(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs',
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/20 text-muted-foreground',
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{part.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PartTypeIcon type={part.type} className="w-3 h-3" />
                    <span>{part.durationMinutes} min</span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/**
 * Mobile part navigation - shows at the top on smaller screens
 */
function MobilePartNavigation({
  parts,
  currentPartIndex,
  onPartSelect,
}: {
  parts: readonly LessonPart[];
  currentPartIndex: number;
  onPartSelect: (index: number) => void;
}) {
  if (parts.length <= 1) return null;

  return (
    <div className="xl:hidden mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {parts.map((part, index) => {
          const isActive = index === currentPartIndex;
          const isCompleted = index < currentPartIndex;

          return (
            <button
              key={part.id}
              onClick={() => onPartSelect(index)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span>{part.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Part navigation buttons (Previous/Next Part)
 */
function PartNavigation({
  parts,
  currentPartIndex,
  onPartSelect,
  prevLesson,
  nextLesson,
}: {
  parts: readonly LessonPart[];
  currentPartIndex: number;
  onPartSelect: (index: number) => void;
  prevLesson: Option.Option<Lesson>;
  nextLesson: Option.Option<Lesson>;
}) {
  const hasPrevPart = currentPartIndex > 0;
  const hasNextPart = currentPartIndex < parts.length - 1;

  return (
    <div className="flex items-stretch gap-4 border-t pt-8 mt-8">
      {/* Previous: either previous part or previous lesson */}
      {hasPrevPart ? (
        <button onClick={() => onPartSelect(currentPartIndex - 1)} className="flex-1">
          <Card className="h-full p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">Previous Part</div>
                <div className="text-sm font-medium truncate">
                  {parts[currentPartIndex - 1]?.title}
                </div>
              </div>
            </div>
          </Card>
        </button>
      ) : Option.isSome(prevLesson) ? (
        <Link to="/lesson/$lessonId" params={{ lessonId: prevLesson.value.id }} className="flex-1">
          <Card className="h-full p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs text-muted-foreground mb-0.5">Previous Lesson</div>
                <div className="text-sm font-medium truncate">{prevLesson.value.title}</div>
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Next: either next part or next lesson */}
      {hasNextPart ? (
        <button onClick={() => onPartSelect(currentPartIndex + 1)} className="flex-1">
          <Card className="h-full p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group text-left">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs text-muted-foreground mb-0.5">Next Part</div>
                <div className="text-sm font-medium truncate">
                  {parts[currentPartIndex + 1]?.title}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
            </div>
          </Card>
        </button>
      ) : Option.isSome(nextLesson) ? (
        <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.value.id }} className="flex-1">
          <Card className="h-full p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs text-muted-foreground mb-0.5">Next Lesson</div>
                <div className="text-sm font-medium truncate">{nextLesson.value.title}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <Link to="/" className="flex-1">
          <Card className="h-full p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs text-muted-foreground mb-0.5 flex items-center justify-end gap-1">
                  <Sparkles className="w-3 h-3" /> Course Complete!
                </div>
                <div className="text-sm font-medium">Back to Overview</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// Mobile Header Component
// =============================================================================

function MobileHeader({ lesson }: { lesson: Lesson }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music className="w-4 h-4 text-primary" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lesson.title}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function LessonPageWrapper() {
  const { lessonId } = Route.useParams();

  return (
    <SidebarProvider defaultOpen>
      <CourseSidebar currentLessonId={lessonId} />
      <Sidebar.Inset>
        <LessonPage lessonId={lessonId} />
      </Sidebar.Inset>
    </SidebarProvider>
  );
}

function LessonPage({ lessonId }: { lessonId: string }) {
  const course = useAtomValue(courseAtom);
  const progressMap = useAtomValue(progressAtom);
  const setCurrentLessonId = useAtomSet(currentLessonIdAtom);
  const currentLesson = useAtomValue(currentLessonAtom);
  const currentSection = useAtomValue(currentSectionAtom);
  const nextLesson = useAtomValue(nextLessonAtom);
  const prevLesson = useAtomValue(previousLessonAtom);
  const setProgress = useAtomSet(progressAtom);

  // Get lesson parts
  const lesson = Option.isSome(currentLesson) ? currentLesson.value : null;
  const parts = lesson ? getLessonParts(lesson.id) : [];

  // Track current part index
  const [currentPartIndex, setCurrentPartIndex] = React.useState(0);

  // Set current lesson ID when component mounts or lessonId changes
  React.useEffect(() => {
    setCurrentLessonId(lessonId);
    // Reset to first part when lesson changes
    setCurrentPartIndex(0);
  }, [lessonId, setCurrentLessonId]);

  const section = Option.isSome(currentSection) ? currentSection.value : null;
  const progress = lesson ? progressMap.get(lesson.id) : undefined;
  const isCompleted = progress?.status === 'completed';
  const currentPart = parts[currentPartIndex];

  const handleMarkComplete = () => {
    if (lesson) {
      setProgress({ _tag: 'MarkComplete', lessonId: lesson.id });
    }
  };

  const handlePartSelect = (index: number) => {
    setCurrentPartIndex(index);
  };

  if (!lesson || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 sm:p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The lesson you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate whether we're on the last part (for showing mark complete button)
  const isLastPart = currentPartIndex === parts.length - 1;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader lesson={lesson} />

      {/* Sticky Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              {course.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="truncate">{section.title}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="truncate font-medium text-foreground">{lesson.title}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <LessonTypeBadge type={lesson.type} />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{lesson.durationMinutes} min</span>
              </div>
              {parts.length > 1 && (
                <Badge variant="outline" className="gap-1.5">
                  Part {currentPartIndex + 1} of {parts.length}
                </Badge>
              )}
              {isCompleted && (
                <Badge className="gap-1.5 bg-emerald-500 hover:bg-emerald-500/90">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentPart &&
                (currentPart.type === 'text' || currentPart.type === 'assignment') && (
                  <a href={`/lesson_/${lesson.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </a>
                )}
              {/* Quick Navigation */}
              {Option.isSome(prevLesson) && (
                <Link to="/lesson/$lessonId" params={{ lessonId: prevLesson.value.id }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              {Option.isSome(nextLesson) && (
                <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.value.id }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Part Sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Part Navigation Sidebar (desktop) */}
        <PartNavigationSidebar
          parts={parts}
          currentPartIndex={currentPartIndex}
          onPartSelect={handlePartSelect}
        />

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Mobile Part Navigation */}
              <MobilePartNavigation
                parts={parts}
                currentPartIndex={currentPartIndex}
                onPartSelect={handlePartSelect}
              />

              {/* Current Part Title (if multi-part lesson) */}
              {parts.length > 1 && currentPart && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{currentPart.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <PartTypeIcon type={currentPart.type} className="w-4 h-4" />
                    <span>{currentPart.durationMinutes} min</span>
                  </div>
                </div>
              )}

              {/* Part Content */}
              <div className="mb-8">
                {currentPart ? (
                  <LessonPartContent part={currentPart} />
                ) : (
                  <div className="bg-muted rounded-xl p-8 text-center border">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No content available for this lesson</p>
                  </div>
                )}
              </div>

              {/* Mark Complete Button (show on last part or if there's no parts) */}
              {!isCompleted && (isLastPart || parts.length === 0) && (
                <div className="mb-8">
                  <Button
                    className="w-full sm:w-auto gap-2 h-12 px-8"
                    size="lg"
                    onClick={handleMarkComplete}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Complete
                  </Button>
                </div>
              )}

              {/* Navigation Cards */}
              <PartNavigation
                parts={parts}
                currentPartIndex={currentPartIndex}
                onPartSelect={handlePartSelect}
                prevLesson={prevLesson}
                nextLesson={nextLesson}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
