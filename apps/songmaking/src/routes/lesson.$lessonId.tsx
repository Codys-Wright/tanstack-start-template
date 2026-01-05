/**
 * Lesson Page
 *
 * Displays the lesson content with video player, text content, or quiz.
 * Includes sidebar navigation and progress tracking.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Card } from '@shadcn';
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
} from 'lucide-react';
import { CourseSidebar } from '../components/course-sidebar.js';
import {
  type Lesson,
  getLessonById,
  getSectionById,
  getNextLesson,
  getPreviousLesson,
  MOCK_PROGRESS,
} from '../data/course.js';

export const Route = createFileRoute('/lesson/$lessonId')({
  component: LessonPage,
});

// =============================================================================
// Helper Components
// =============================================================================

function LessonTypeIcon({ type, className }: { type: Lesson['type']; className?: string }) {
  const iconClass = className ?? 'w-5 h-5';
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
    video: 'Video',
    text: 'Article',
    quiz: 'Quiz',
    assignment: 'Assignment',
    download: 'Download',
  };
  return (
    <Badge variant="secondary" className="gap-1">
      <LessonTypeIcon type={type} className="w-3 h-3" />
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
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  const { provider, videoId } = lesson.videoContent;

  // YouTube embed
  if (provider === 'youtube') {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Vimeo embed
  if (provider === 'vimeo') {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
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

  // Custom video
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video className="w-full h-full" controls src={videoId}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function TextContent({ lesson }: { lesson: Lesson }) {
  if (!lesson.mdxContent) {
    return (
      <div className="bg-muted rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  // Simple markdown-like rendering (in production, use MDX)
  const content = lesson.mdxContent;

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
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
            <h2 key={i} className="text-2xl font-bold mt-6 mb-3">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xl font-semibold mt-4 mb-2">
              {block.slice(4)}
            </h3>
          );
        }

        // Blockquotes
        if (block.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
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
            <pre key={i} className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
              <code className="text-sm">{code}</code>
            </pre>
          );
        }

        // Lists
        if (block.match(/^[-*] /m)) {
          const items = block.split('\n').filter((line) => line.match(/^[-*] /));
          return (
            <ul key={i} className="list-disc pl-6 my-4 space-y-1">
              {items.map((item, j) => (
                <li key={j}>{item.slice(2)}</li>
              ))}
            </ul>
          );
        }

        // Numbered lists
        if (block.match(/^\d+\. /m)) {
          const items = block.split('\n').filter((line) => line.match(/^\d+\. /));
          return (
            <ol key={i} className="list-decimal pl-6 my-4 space-y-1">
              {items.map((item, j) => (
                <li key={j}>{item.replace(/^\d+\. /, '')}</li>
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
              <div key={i} className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {headers.map((header, j) => (
                        <th key={j} className="text-left p-2 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, j) => (
                      <tr key={j} className="border-b">
                        {row.map((cell, k) => (
                          <td key={k} className="p-2">
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

        // Regular paragraphs
        if (block.trim()) {
          // Handle inline formatting
          let formatted = block;
          // Bold
          formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          // Italic
          formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
          // Code
          formatted = formatted.replace(
            /`(.+?)`/g,
            '<code class="bg-muted px-1 rounded">$1</code>',
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
    </div>
  );
}

function QuizContent({ lesson }: { lesson: Lesson }) {
  return (
    <Card className="p-8 text-center">
      <HelpCircle className="w-16 h-16 mx-auto text-primary mb-4" />
      <h3 className="text-xl font-bold mb-2">Quiz: {lesson.title}</h3>
      <p className="text-muted-foreground mb-6">
        Test your knowledge with this quiz. You need to score at least{' '}
        {lesson.quizPassingScore ?? 70}% to pass.
      </p>
      <Button size="lg">
        <PlayCircle className="w-5 h-5 mr-2" />
        Start Quiz
      </Button>
    </Card>
  );
}

function AssignmentContent({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <Card className="p-6 mb-6 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-bold">Assignment</h3>
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
    <Card className="p-8 text-center">
      <FileDown className="w-16 h-16 mx-auto text-primary mb-4" />
      <h3 className="text-xl font-bold mb-2">Downloadable Resources</h3>
      <p className="text-muted-foreground mb-6">{lesson.description}</p>
      <Button size="lg">
        <FileDown className="w-5 h-5 mr-2" />
        Download Files
      </Button>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function LessonPage() {
  const { lessonId } = Route.useParams();

  const lesson = getLessonById(lessonId);
  const section = lesson ? getSectionById(lesson.sectionId) : null;
  const nextLesson = getNextLesson(lessonId);
  const prevLesson = getPreviousLesson(lessonId);
  const progress = MOCK_PROGRESS.get(lessonId);
  const isCompleted = progress?.status === 'completed';

  if (!lesson || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The lesson you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <CourseSidebar currentLessonId={lessonId} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Breadcrumb / Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link to="/" className="hover:text-foreground transition-colors">
                Course
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>{section.title}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                <div className="flex items-center gap-3">
                  <LessonTypeBadge type={lesson.type} />
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.durationMinutes} min</span>
                  </div>
                  {isCompleted && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
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
              <Button className="w-full" size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between border-t pt-6">
            {prevLesson ? (
              <Button variant="outline" asChild>
                <Link to="/lesson/$lessonId" params={{ lessonId: prevLesson.id }}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Previous</div>
                    <div className="text-sm">{prevLesson.title}</div>
                  </div>
                </Link>
              </Button>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Button asChild>
                <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>
                  <div className="text-right">
                    <div className="text-xs opacity-80">Next</div>
                    <div className="text-sm">{nextLesson.title}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/">
                  <div className="text-right">
                    <div className="text-xs opacity-80">Complete!</div>
                    <div className="text-sm">Back to Course</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
