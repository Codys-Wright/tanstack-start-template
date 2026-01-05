/**
 * Course Sidebar Component
 *
 * Displays the course sections and lessons in a collapsible sidebar.
 * Shows progress indicators and allows navigation between lessons.
 */

import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge, Button, Progress, ScrollArea } from '@shadcn';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  HelpCircle,
  FileDown,
  ClipboardList,
  Lock,
} from 'lucide-react';
import {
  type Section,
  type Lesson,
  type LessonProgress,
  SONGMAKING_COURSE,
  SONGMAKING_SECTIONS,
  getSectionLessons,
  MOCK_PROGRESS,
} from '../data/course.js';

// =============================================================================
// Types
// =============================================================================

interface CourseSidebarProps {
  currentLessonId?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

function LessonTypeIcon({ type }: { type: Lesson['type'] }) {
  switch (type) {
    case 'video':
      return <PlayCircle className="w-4 h-4" />;
    case 'text':
      return <FileText className="w-4 h-4" />;
    case 'quiz':
      return <HelpCircle className="w-4 h-4" />;
    case 'assignment':
      return <ClipboardList className="w-4 h-4" />;
    case 'download':
      return <FileDown className="w-4 h-4" />;
  }
}

function LessonProgressIcon({ progress }: { progress?: LessonProgress }) {
  if (!progress || progress.status === 'not_started') {
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
  if (progress.status === 'completed') {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
  // in_progress
  return <Circle className="w-4 h-4 text-blue-500 fill-blue-500/30" />;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// =============================================================================
// Section Component
// =============================================================================

function SectionItem({
  section,
  isExpanded,
  onToggle,
  currentLessonId,
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  currentLessonId?: string;
}) {
  const lessons = getSectionLessons(section.id);
  const completedCount = lessons.filter(
    (l) => MOCK_PROGRESS.get(l.id)?.status === 'completed',
  ).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="border-b last:border-b-0">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{section.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {completedCount}/{lessons.length} lessons
            </span>
            <span>-</span>
            <span>{formatDuration(section.totalDurationMinutes)}</span>
          </div>
        </div>
        {progressPercent > 0 && (
          <div className="w-8">
            <Progress value={progressPercent} className="h-1" />
          </div>
        )}
      </button>

      {/* Lessons */}
      {isExpanded && (
        <div className="pb-2">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              isActive={lesson.id === currentLessonId}
              progress={MOCK_PROGRESS.get(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Lesson Component
// =============================================================================

function LessonItem({
  lesson,
  isActive,
  progress,
}: {
  lesson: Lesson;
  isActive: boolean;
  progress?: LessonProgress;
}) {
  const isLocked = !lesson.isFree && !progress;

  return (
    <Link
      to="/lesson/$lessonId"
      params={{ lessonId: lesson.id }}
      className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : isLocked
            ? 'text-muted-foreground hover:bg-muted/50'
            : 'hover:bg-muted'
      }`}
    >
      <div className="flex-shrink-0">
        {isLocked ? <Lock className="w-4 h-4" /> : <LessonProgressIcon progress={progress} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate">{lesson.title}</div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <LessonTypeIcon type={lesson.type} />
        <span>{lesson.durationMinutes}m</span>
      </div>
      {lesson.isFree && !isActive && (
        <Badge variant="secondary" className="text-xs">
          Free
        </Badge>
      )}
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CourseSidebar({ currentLessonId }: CourseSidebarProps) {
  // Expand the section containing the current lesson by default
  const currentLesson = currentLessonId
    ? SONGMAKING_SECTIONS.find((s) => getSectionLessons(s.id).some((l) => l.id === currentLessonId))
    : null;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(currentLesson ? [currentLesson.id] : [SONGMAKING_SECTIONS[0]?.id]),
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Calculate overall progress
  const totalLessons = SONGMAKING_COURSE.lessonCount;
  const completedLessons = Array.from(MOCK_PROGRESS.values()).filter(
    (p) => p.status === 'completed',
  ).length;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="w-80 border-r flex flex-col h-full bg-background">
      {/* Course Header */}
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg">{SONGMAKING_COURSE.title}</h1>
        </Link>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>
              {completedLessons} of {totalLessons} lessons complete
            </span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {SONGMAKING_SECTIONS.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              currentLessonId={currentLessonId}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Link to="/" className="block">
          <Button variant="outline" className="w-full">
            Back to Course Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
