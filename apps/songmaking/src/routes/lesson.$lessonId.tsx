/**
 * Lesson Page
 *
 * A polished lesson viewer with responsive layout, smooth animations,
 * and beautiful content rendering. Uses Effect Atom for state management.
 */

import { createFileRoute, Link, Outlet, useMatch } from '@tanstack/react-router';
import { useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import * as Option from 'effect/Option';
import { Badge, Button, Card, Sidebar, SidebarProvider, useSidebar } from '@shadcn';
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
} from 'lucide-react';
import { CourseSidebar } from '../components/course-sidebar.js';
import { type Lesson } from '../data/course.js';
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
// Content Components
// =============================================================================

function VideoContent({ lesson }: { lesson: Lesson }) {
  if (!lesson.videoContent) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border">
        <div className="text-center">
          <PlayCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Video not available</p>
        </div>
      </div>
    );
  }

  const { provider, videoId } = lesson.videoContent;

  if (provider === 'youtube') {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={lesson.title}
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
          title={lesson.title}
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

function TextContent({ lesson }: { lesson: Lesson }) {
  if (!lesson.mdxContent) {
    return (
      <div className="bg-muted rounded-xl p-8 text-center border">
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  const content = lesson.mdxContent;

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-li:leading-relaxed prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border">
      {content.split('\n\n').map((block, i) => {
        // Headers
        if (block.startsWith('# ')) {
          return (
            <h1 key={i} className="text-3xl font-bold mt-8 mb-4 first:mt-0">
              {block.slice(2)}
            </h1>
          );
        }
        if (block.startsWith('## ')) {
          return (
            <h2 key={i} className="text-2xl font-bold mt-8 mb-4">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xl font-semibold mt-6 mb-3">
              {block.slice(4)}
            </h3>
          );
        }

        // Blockquotes
        if (block.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary pl-4 py-1 italic text-muted-foreground my-6 bg-muted/30 rounded-r-lg pr-4"
            >
              {block.slice(2)}
            </blockquote>
          );
        }

        // Code blocks
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          const code = lines.slice(1, -1).join('\n');
          return (
            <pre key={i} className="bg-muted border p-4 rounded-xl overflow-x-auto my-6">
              <code className="text-sm">{code}</code>
            </pre>
          );
        }

        // Lists
        if (block.match(/^[-*] /m)) {
          const items = block.split('\n').filter((line) => line.match(/^[-*] /));
          return (
            <ul key={i} className="list-none pl-0 my-6 space-y-2">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span>{item.slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Numbered lists
        if (block.match(/^\d+\. /m)) {
          const items = block.split('\n').filter((line) => line.match(/^\d+\. /));
          return (
            <ol key={i} className="list-none pl-0 my-6 space-y-2">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {j + 1}
                  </span>
                  <span>{item.replace(/^\d+\. /, '')}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Tables (simple)
        if (block.includes('|')) {
          const rows = block.split('\n').filter((line) => line.includes('|'));
          if (rows.length > 1) {
            const headers = rows[0]
              .split('|')
              .filter(Boolean)
              .map((h) => h.trim());
            const dataRows = rows.slice(2).map((row) =>
              row
                .split('|')
                .filter(Boolean)
                .map((cell) => cell.trim()),
            );

            return (
              <div key={i} className="overflow-x-auto my-6 border rounded-xl">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      {headers.map((header, j) => (
                        <th key={j} className="text-left px-4 py-3 text-sm font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dataRows.map((row, j) => (
                      <tr key={j} className="hover:bg-muted/30 transition-colors">
                        {row.map((cell, k) => (
                          <td key={k} className="px-4 py-3 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Checkboxes
        if (block.includes('- [ ]') || block.includes('- [x]')) {
          const items = block.split('\n').filter((line) => line.match(/- \[[ x]\]/));
          return (
            <ul key={i} className="list-none pl-0 my-6 space-y-2">
              {items.map((item, j) => {
                const isChecked = item.includes('[x]');
                const text = item.replace(/- \[[ x]\] /, '');
                return (
                  <li key={j} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                        isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/30',
                      )}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={cn(isChecked && 'line-through text-muted-foreground')}>
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraphs
        if (block.trim()) {
          let formatted = block;
          formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
          formatted = formatted.replace(
            /`(.+?)`/g,
            '<code class="bg-muted px-1.5 py-0.5 rounded-md text-sm">$1</code>',
          );

          return (
            <p
              key={i}
              className="my-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          );
        }

        return null;
      })}
    </article>
  );
}

function QuizContent({ lesson }: { lesson: Lesson }) {
  return (
    <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-500/5 to-transparent border-amber-500/20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Quiz: {lesson.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Test your knowledge with this quiz. You need to score at least{' '}
        <span className="font-semibold text-foreground">{lesson.quizPassingScore ?? 70}%</span> to
        pass.
      </p>
      <Button size="lg" className="gap-2 h-12 px-8">
        <PlayCircle className="w-5 h-5" />
        Start Quiz
      </Button>
    </Card>
  );
}

function AssignmentContent({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Assignment</h3>
            <p className="text-sm text-muted-foreground">
              Complete this assignment to practice what you've learned
            </p>
          </div>
        </div>
      </Card>
      <TextContent lesson={lesson} />
    </div>
  );
}

function DownloadContent({ lesson }: { lesson: Lesson }) {
  return (
    <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-cyan-500/5 to-transparent border-cyan-500/20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
        <FileDown className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Downloadable Resources</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{lesson.description}</p>
      <Button size="lg" className="gap-2 h-12 px-8">
        <FileDown className="w-5 h-5" />
        Download Files
      </Button>
    </Card>
  );
}

// =============================================================================
// Navigation Components
// =============================================================================

function LessonNavigation({
  prevLesson,
  nextLesson,
}: {
  prevLesson: Option.Option<Lesson>;
  nextLesson: Option.Option<Lesson>;
}) {
  return (
    <div className="flex items-stretch gap-4 border-t pt-8 mt-8">
      {Option.isSome(prevLesson) ? (
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

      {Option.isSome(nextLesson) ? (
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

  // Check if we're on a child route (like /edit)
  const editMatch = useMatch({
    from: '/lesson/$lessonId/edit',
    shouldThrow: false,
  });
  const hasChildRoute = !!editMatch;

  // If there's a child route, just render the Outlet
  if (hasChildRoute) {
    return <Outlet />;
  }

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

  // Set current lesson ID when component mounts or lessonId changes
  React.useEffect(() => {
    setCurrentLessonId(lessonId);
  }, [lessonId, setCurrentLessonId]);

  const lesson = Option.isSome(currentLesson) ? currentLesson.value : null;
  const section = Option.isSome(currentSection) ? currentSection.value : null;
  const progress = lesson ? progressMap.get(lesson.id) : undefined;
  const isCompleted = progress?.status === 'completed';

  const handleMarkComplete = () => {
    if (lesson) {
      setProgress({ _tag: 'MarkComplete', lessonId: lesson.id });
    }
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

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader lesson={lesson} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Breadcrumb / Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              {course.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="truncate">{section.title}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">{lesson.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <LessonTypeBadge type={lesson.type} />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.durationMinutes} min</span>
                </div>
                {isCompleted && (
                  <Badge className="gap-1.5 bg-emerald-500 hover:bg-emerald-500/90">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            {(lesson.type === 'text' || lesson.type === 'assignment') && (
              <Link to="/lesson/$lessonId/edit" params={{ lessonId: lesson.id }}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="mb-8">
          {lesson.type === 'video' && <VideoContent lesson={lesson} />}
          {lesson.type === 'text' && <TextContent lesson={lesson} />}
          {lesson.type === 'quiz' && <QuizContent lesson={lesson} />}
          {lesson.type === 'assignment' && <AssignmentContent lesson={lesson} />}
          {lesson.type === 'download' && <DownloadContent lesson={lesson} />}
        </div>

        {/* Mark Complete Button */}
        {!isCompleted && (
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

        {/* Navigation */}
        <LessonNavigation prevLesson={prevLesson} nextLesson={nextLesson} />
      </div>
    </>
  );
}
