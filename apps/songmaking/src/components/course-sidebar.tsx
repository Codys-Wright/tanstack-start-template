/**
 * Course Sidebar Component
 *
 * Uses the shadcn Sidebar component with Effect Atom for state management.
 * Features collapsible sections, progress tracking, path indicators, and responsive design.
 */

import { Link } from '@tanstack/react-router';
import { useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import { Sidebar, useSidebar, Collapsible, Badge, Progress, ScrollArea } from '@shadcn';
import {
  ChevronDown,
  CheckCircle2,
  Lock,
  Music,
  Sparkles,
  Home,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@auth';
import {
  type Section,
  type Lesson,
  type LessonProgress,
  getSectionLessons,
  getPathById,
} from '../data/course.js';
import {
  courseAtom,
  sectionsAtom,
  progressAtom,
  courseProgressAtom,
  expandedSectionsAtom,
  sectionProgressAtom,
} from '../features/course/client/course-atoms.js';
import { cn } from '@shadcn/lib/utils';
import * as React from 'react';

// =============================================================================
// Sidebar Width Override - wider for better readability
// =============================================================================

const SIDEBAR_STYLES = {
  '--sidebar-width': '20rem',
  '--sidebar-width-mobile': '22rem',
} as React.CSSProperties;

// =============================================================================
// Helper Components
// =============================================================================

function LessonProgressIcon({
  progress,
  isActive,
}: {
  progress?: LessonProgress;
  isActive?: boolean;
}) {
  if (!progress || progress.status === 'not_started') {
    return (
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          isActive ? 'border-primary-foreground/50' : 'border-muted-foreground/30',
        )}
      >
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-200',
            isActive ? 'bg-primary-foreground/50' : 'bg-transparent',
          )}
        />
      </div>
    );
  }
  if (progress.status === 'completed') {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  // in_progress
  return (
    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
    </div>
  );
}

// =============================================================================
// Lesson Item Component
// =============================================================================

function LessonItem({
  lesson,
  progress,
  isActive,
  isMobile,
  setOpenMobile,
}: {
  lesson: Lesson;
  progress?: LessonProgress;
  isActive: boolean;
  isMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}) {
  const isLocked = !lesson.isFree && !progress;
  const path = lesson.pathId ? getPathById(lesson.pathId) : null;

  return (
    <Link
      to="/lesson/$lessonId"
      params={{ lessonId: lesson.id }}
      onClick={() => {
        if (isMobile) {
          setOpenMobile(false);
        }
      }}
      className={cn(
        'group flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200',
        'hover:bg-sidebar-accent/60',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
        isLocked && 'opacity-50 cursor-not-allowed',
      )}
    >
      {/* Path Color Indicator */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: path?.color ?? 'transparent' }}
        title={path?.name}
      />

      {/* Progress Indicator */}
      <div className="flex-shrink-0">
        <LessonProgressIcon progress={progress} isActive={isActive} />
      </div>

      {/* Lesson Title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium leading-snug break-words min-w-0',
          isActive ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        {lesson.title}
      </span>

      {/* Right side indicators */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {lesson.isFree && (
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-1.5 py-0 h-4 font-medium',
              isActive && 'bg-primary-foreground/20 text-primary-foreground',
            )}
          >
            Free
          </Badge>
        )}
        {isLocked && (
          <Lock
            className={cn(
              'w-3.5 h-3.5',
              isActive ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          />
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// Section Item Component
// =============================================================================

function SectionItem({
  section,
  sectionIndex,
  currentLessonId,
}: {
  section: Section;
  sectionIndex: number;
  currentLessonId?: string;
}) {
  const lessons = getSectionLessons(section.id);
  const progressMap = useAtomValue(progressAtom);
  const expandedSections = useAtomValue(expandedSectionsAtom);
  const setExpandedSections = useAtomSet(expandedSectionsAtom);
  const { isMobile, setOpenMobile } = useSidebar();

  const sectionProgress = useAtomValue(sectionProgressAtom(section.id));
  const isExpanded = expandedSections.has(section.id);
  const isCurrentSection = lessons.some((l) => l.id === currentLessonId);

  const toggleSection = () => {
    setExpandedSections({ _tag: 'Toggle', sectionId: section.id });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={toggleSection}>
      <Sidebar.MenuItem>
        {/* Section Header */}
        <Collapsible.Trigger asChild>
          <Sidebar.MenuButton
            className={cn(
              'h-auto py-3.5 px-3',
              isCurrentSection && !isExpanded && 'bg-sidebar-accent/50',
            )}
          >
            {/* Section Number Badge */}
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0',
                sectionProgress.percent === 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : isCurrentSection
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {sectionProgress.percent === 100 ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : (
                sectionIndex + 1
              )}
            </div>

            {/* Section Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm leading-tight mb-1">{section.title}</div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {sectionProgress.completed}/{sectionProgress.total} lessons
                </span>
              </div>
            </div>

            {/* Expand Icon */}
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                'hover:bg-sidebar-accent',
              )}
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )}
              />
            </div>
          </Sidebar.MenuButton>
        </Collapsible.Trigger>

        {/* Section Progress Bar */}
        {sectionProgress.percent > 0 && sectionProgress.percent < 100 && (
          <div className="px-3 pb-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${sectionProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Lessons List */}
        <Collapsible.Content>
          <div className="px-2 pb-3 pt-1 space-y-1">
            {lessons.map((lesson) => {
              const progress = progressMap.get(lesson.id);
              const isActive = lesson.id === currentLessonId;

              return (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  progress={progress}
                  isActive={isActive}
                  isMobile={isMobile}
                  setOpenMobile={setOpenMobile}
                />
              );
            })}
          </div>
        </Collapsible.Content>
      </Sidebar.MenuItem>
    </Collapsible>
  );
}

// =============================================================================
// Main Sidebar Component
// =============================================================================

interface CourseSidebarProps {
  currentLessonId?: string;
}

export function CourseSidebar({ currentLessonId }: CourseSidebarProps) {
  const course = useAtomValue(courseAtom);
  const sections = useAtomValue(sectionsAtom);
  const courseProgress = useAtomValue(courseProgressAtom);
  const setExpandedSections = useAtomSet(expandedSectionsAtom);
  const { isMobile, setOpenMobile } = useSidebar();

  // Auto-expand section containing current lesson
  React.useEffect(() => {
    if (currentLessonId) {
      const currentSection = sections.find((s) =>
        getSectionLessons(s.id).some((l) => l.id === currentLessonId),
      );
      if (currentSection) {
        setExpandedSections({ _tag: 'Expand', sectionId: currentSection.id });
      }
    }
  }, [currentLessonId, sections, setExpandedSections]);

  return (
    <Sidebar
      collapsible="none"
      className="border-r overflow-hidden h-svh sticky top-0"
      style={SIDEBAR_STYLES}
    >
      {/* Course Header */}
      <Sidebar.Header className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg" asChild tooltip={course.title} className="h-auto py-4">
              <Link
                to="/"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Music className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-base leading-tight truncate">{course.title}</h1>
                  <p className="text-xs text-muted-foreground truncate">
                    Master the art of song creation
                  </p>
                </div>
              </Link>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>

        {/* Overall Progress */}
        <div className="px-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Overall Progress</span>
              <span className="font-bold text-foreground">
                {Math.round(courseProgress.percent)}%
              </span>
            </div>
            <Progress value={courseProgress.percent} className="h-2.5" />
            <p className="text-xs text-muted-foreground">
              {courseProgress.completed} of {courseProgress.total} lessons complete
              {courseProgress.completed === courseProgress.total && courseProgress.total > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3 h-3" /> Complete!
                </span>
              )}
            </p>
          </div>
        </div>
      </Sidebar.Header>

      {/* Quick Navigation */}
      <Sidebar.Group className="py-3">
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton asChild tooltip="My Dashboard" className="h-10">
                <Link
                  to="/dashboard"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-medium">My Dashboard</span>
                </Link>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Separator />

      {/* Course Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <Sidebar.Group className="py-3">
            <Sidebar.GroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1">
              Course Content
            </Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {sections.map((section, index) => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    sectionIndex={index}
                    currentLessonId={currentLessonId}
                  />
                ))}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </ScrollArea>
      </div>

      {/* Footer */}
      <Sidebar.Footer className="border-t py-3 space-y-2">
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild tooltip="Course Overview" className="h-10">
              <Link
                to="/"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Home className="w-4 h-4" />
                <span className="font-medium">Course Overview</span>
              </Link>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>

        {/* User Account Card */}
        <div className="px-2">
          <SignedIn>
            <div className="rounded-lg border bg-card p-1">
              <UserButton size="default" className="w-full justify-start hover:bg-accent" />
            </div>
          </SignedIn>
          <SignedOut>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to track your progress and save your work.
              </p>
              <Link to="/auth/$authView" params={{ authView: 'sign-in' }}>
                <Sidebar.MenuButton className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Sign In</span>
                </Sidebar.MenuButton>
              </Link>
            </div>
          </SignedOut>
        </div>
      </Sidebar.Footer>
    </Sidebar>
  );
}

// =============================================================================
// App Sidebar Layout - wraps pages that need the sidebar
// =============================================================================

interface AppSidebarLayoutProps {
  children: React.ReactNode;
  currentLessonId?: string;
}

export function AppSidebarLayout({ children, currentLessonId }: AppSidebarLayoutProps) {
  return (
    <Sidebar.Provider defaultOpen>
      <CourseSidebar currentLessonId={currentLessonId} />
      <Sidebar.Inset>{children}</Sidebar.Inset>
    </Sidebar.Provider>
  );
}
