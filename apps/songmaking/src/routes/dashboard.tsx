/**
 * Course Dashboard / Overview Page
 *
 * Shows the user their progress across all paths, recent activity,
 * and provides navigation to continue learning.
 */

import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAtomValue } from '@effect-atom/atom-react';
import { Badge, Button, Card, Progress, ScrollArea, Sidebar, SidebarProvider } from '@shadcn';
import {
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Trophy,
  Flame,
  Music,
  Palette,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { CourseSidebar } from '../components/course-sidebar.js';
import {
  SONGMAKING_LESSONS,
  getAllPaths,
  getPathLessons,
  getSectionLessons,
  SONGMAKING_SECTIONS,
  type Path,
} from '../data/course.js';
import { courseAtom, progressAtom } from '../features/course/client/course-atoms.js';
import { cn } from '@shadcn/lib/utils';

export const Route = createFileRoute('/dashboard' as any)({
  component: DashboardPageWrapper,
});

// =============================================================================
// Helper Components
// =============================================================================

function PathIcon({
  icon,
  className,
  style,
}: {
  icon: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}) {
  const iconClass = cn('w-5 h-5', className);
  switch (icon) {
    case 'music':
      return <Music className={iconClass} style={style} />;
    case 'palette':
      return <Palette className={iconClass} style={style} />;
    case 'dollar-sign':
      return <DollarSign className={iconClass} style={style} />;
    default:
      return <BookOpen className={iconClass} style={style} />;
  }
}

// =============================================================================
// Path Progress Card
// =============================================================================

function PathProgressCard({ path }: { path: Path }) {
  const progressMap = useAtomValue(progressAtom);
  const lessons = getPathLessons(path.id);

  // Calculate progress for this path
  const total = lessons.length;
  const completed = lessons.filter((l) => progressMap.get(l.id)?.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Find next incomplete lesson in this path
  const nextLesson = lessons.find((l) => progressMap.get(l.id)?.status !== 'completed');

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${path.color}20` }}
        >
          <PathIcon icon={path.icon} className="w-6 h-6" style={{ color: path.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg">{path.name}</h3>
            <span className="text-sm text-muted-foreground">
              {completed}/{total} lessons
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{path.description}</p>

          <div className="mb-3">
            <Progress value={percentage} className="h-2" />
          </div>

          {nextLesson ? (
            <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>
              <Button variant="outline" size="sm" className="gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : completed === total && total > 0 ? (
            <Badge className="bg-emerald-500 hover:bg-emerald-500/90 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Continue Learning Card
// =============================================================================

function ContinueLearningCard() {
  const progressMap = useAtomValue(progressAtom);

  // Find the first incomplete lesson
  const nextLesson = SONGMAKING_LESSONS.find((l) => progressMap.get(l.id)?.status !== 'completed');

  // Find section for this lesson
  const section = nextLesson
    ? SONGMAKING_SECTIONS.find((s) => s.id === nextLesson.sectionId)
    : null;

  if (!nextLesson) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Course Complete!</h3>
        <p className="text-muted-foreground mb-4">Congratulations! You've completed all lessons.</p>
        <Link to="/">
          <Button variant="outline">Review Course</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Continue Learning</span>
        </div>
        <h3 className="text-xl font-bold mb-1">{nextLesson.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {section?.title} &middot; {nextLesson.durationMinutes} min
        </p>
        <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>
          <Button className="gap-2">
            <PlayCircle className="w-4 h-4" />
            Start Lesson
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// =============================================================================
// Overall Progress Card
// =============================================================================

function OverallProgressCard() {
  const progressMap = useAtomValue(progressAtom);
  const course = useAtomValue(courseAtom);

  // Calculate overall course progress
  const total = SONGMAKING_LESSONS.length;
  const completed = SONGMAKING_LESSONS.filter(
    (l) => progressMap.get(l.id)?.status === 'completed',
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Overall Progress</h3>
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-3 mb-4" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Completed</div>
          <div className="font-medium">{completed} lessons</div>
        </div>
        <div>
          <div className="text-muted-foreground">Remaining</div>
          <div className="font-medium">{total - completed} lessons</div>
        </div>
        <div>
          <div className="text-muted-foreground">Total Duration</div>
          <div className="font-medium">{course.totalDurationMinutes} min</div>
        </div>
        <div>
          <div className="text-muted-foreground">Sections</div>
          <div className="font-medium">{course.sectionCount}</div>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Recent Lessons List
// =============================================================================

function RecentLessonsList() {
  const progressMap = useAtomValue(progressAtom);

  // Get lessons with progress (recently touched)
  const lessonsWithProgress = SONGMAKING_LESSONS.filter((l) => progressMap.has(l.id)).slice(0, 5);

  if (lessonsWithProgress.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {lessonsWithProgress.map((lesson) => {
          const progress = progressMap.get(lesson.id);
          const isCompleted = progress?.status === 'completed';
          const section = SONGMAKING_SECTIONS.find((s) => s.id === lesson.sectionId);

          return (
            <Link
              key={lesson.id}
              to="/lesson/$lessonId"
              params={{ lessonId: lesson.id }}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isCompleted ? 'bg-emerald-500/20' : 'bg-muted',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <PlayCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{lesson.title}</div>
                <div className="text-xs text-muted-foreground">{section?.title}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function DashboardPageWrapper() {
  return (
    <SidebarProvider defaultOpen>
      <CourseSidebar />
      <Sidebar.Inset>
        <DashboardPage />
      </Sidebar.Inset>
    </SidebarProvider>
  );
}

function DashboardPage() {
  const course = useAtomValue(courseAtom);
  const paths = getAllPaths();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground transition-colors">
              {course.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold">Your Learning Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and continue where you left off
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Top Row: Continue + Progress */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <ContinueLearningCard />
              <OverallProgressCard />
            </div>

            {/* Learning Paths */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Learning Paths</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paths.map((path) => (
                  <PathProgressCard key={path.id} path={path} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <RecentLessonsList />

              {/* Quick Links */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link to="/">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BookOpen className="w-4 h-4" />
                      Course Overview
                    </Button>
                  </Link>
                  {SONGMAKING_SECTIONS.slice(0, 3).map((section) => {
                    const lessons = getSectionLessons(section.id);
                    const firstLesson = lessons[0];
                    if (!firstLesson) return null;
                    return (
                      <Link
                        key={section.id}
                        to="/lesson/$lessonId"
                        params={{ lessonId: firstLesson.id }}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <ChevronRight className="w-4 h-4" />
                          {section.title}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
