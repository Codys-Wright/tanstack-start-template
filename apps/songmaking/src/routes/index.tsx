/**
 * Course Overview Page
 *
 * A beautiful, polished landing page for the Songmaking course.
 * Features gradient backgrounds, smooth animations, and responsive design.
 * Uses Effect Atom for state management.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useAtomValue } from '@effect-atom/atom-react';
import * as Option from 'effect/Option';
import { Badge, Button, Card, Separator } from '@shadcn';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Music,
  Mic2,
  Headphones,
  PenLine,
  Sparkles,
  Star,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  courseAtom,
  sectionsAtom,
  progressAtom,
  courseProgressAtom,
  firstIncompleteLessonAtom,
  sectionProgressAtom,
} from '../features/course/client/course-atoms.js';
import { getSectionLessons, type Section, type Course } from '../data/course.js';
import { cn } from '@shadcn/lib/utils';
import { Navbar } from '../components/navbar.js';

export const Route = createFileRoute('/')({
  component: CourseOverviewPage,
});

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
}

// =============================================================================
// Hero Section
// =============================================================================

function HeroSection({
  course,
  courseProgress,
  firstIncompleteLesson,
}: {
  course: Course;
  courseProgress: { completed: number; total: number; percent: number };
  firstIncompleteLesson: Option.Option<{ id: string }>;
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Course Info */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-0"
              >
                {course.level.replace('-', ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                4.9 Rating
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              {course.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
              {course.subtitle}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <span>{course.sectionCount} sections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span>{course.lessonCount} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <span>{formatDuration(course.totalDurationMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span>2,847 students</span>
              </div>
            </div>

            {/* Progress Bar (if started) */}
            {courseProgress.completed > 0 && (
              <div className="mb-8 p-4 rounded-xl bg-card border shadow-sm">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Progress
                  </span>
                  <span className="text-muted-foreground">
                    {courseProgress.completed} of {courseProgress.total} lessons
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700"
                    style={{ width: `${courseProgress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {courseProgress.percent === 100
                    ? "Congratulations! You've completed the course!"
                    : `${Math.round(courseProgress.percent)}% complete - Keep going!`}
                </p>
              </div>
            )}

            {/* CTA Button */}
            {Option.isSome(firstIncompleteLesson) && (
              <div className="flex flex-wrap gap-4">
                <Link to="/lesson/$lessonId" params={{ lessonId: firstIncompleteLesson.value.id }}>
                  <Button
                    size="lg"
                    className="h-12 px-6 text-base gap-2 shadow-lg shadow-primary/20"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {courseProgress.completed > 0 ? 'Continue Learning' : 'Start Course'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/lesson/$lessonId" params={{ lessonId: 'lesson-001' }}>
                  <Button variant="outline" size="lg" className="h-12 px-6 text-base">
                    Preview First Lesson
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Course Visual */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border shadow-2xl shadow-primary/10">
              {/* Decorative music elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-8 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Music className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Floating icons */}
              <div className="absolute top-6 left-6 w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float">
                <Mic2 className="w-5 h-5 text-primary" />
              </div>
              <div
                className="absolute top-6 right-6 w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float"
                style={{ animationDelay: '0.5s' }}
              >
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div
                className="absolute bottom-6 left-6 w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float"
                style={{ animationDelay: '1s' }}
              >
                <PenLine className="w-5 h-5 text-primary" />
              </div>
              <div
                className="absolute bottom-6 right-6 w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float"
                style={{ animationDelay: '1.5s' }}
              >
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// What You'll Learn Section
// =============================================================================

function WhatYoullLearn() {
  const learningPoints = [
    { icon: Music, text: 'Write compelling melodies and chord progressions' },
    {
      icon: PenLine,
      text: 'Craft meaningful lyrics that connect with listeners',
    },
    { icon: Layers, text: 'Understand song structure and arrangement' },
    { icon: Mic2, text: 'Record and produce your own demos' },
    { icon: Headphones, text: 'Mix and master your tracks' },
    { icon: Sparkles, text: 'Develop a consistent creative practice' },
  ];

  return (
    <div className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <Award className="w-3 h-3 mr-1" />
            Skills You'll Gain
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What You'll Learn</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Master the complete songwriting process from initial idea to finished production.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <point.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium leading-relaxed">{point.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Section Card Component
// =============================================================================

function SectionCard({ section, sectionIndex }: { section: Section; sectionIndex: number }) {
  const lessons = getSectionLessons(section.id);
  const progressMap = useAtomValue(progressAtom);
  const sectionProgress = useAtomValue(sectionProgressAtom(section.id));

  return (
    <Card className="overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
              sectionProgress.percent === 100
                ? 'bg-emerald-500 text-white'
                : 'bg-primary/10 text-primary',
            )}
          >
            {sectionProgress.percent === 100 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              sectionIndex + 1
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-1">
              <h3 className="font-semibold text-lg">{section.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                <span>{lessons.length} lessons</span>
                <span className="hidden sm:inline">-</span>
                <span className="hidden sm:inline">
                  {formatDuration(section.totalDurationMinutes)}
                </span>
              </div>
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
            {sectionProgress.percent > 0 && sectionProgress.percent < 100 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${sectionProgress.percent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="divide-y">
        {lessons.map((lesson, lessonIndex) => {
          const progress = progressMap.get(lesson.id);
          const isCompleted = progress?.status === 'completed';

          return (
            <Link
              key={lesson.id}
              to="/lesson/$lessonId"
              params={{ lessonId: lesson.id }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : lessonIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {lesson.title}
                </span>
                {lesson.isFree && (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                    Free
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="hidden sm:inline">{lesson.durationMinutes}m</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// =============================================================================
// Course Curriculum Section
// =============================================================================

function CourseCurriculum() {
  const course = useAtomValue(courseAtom);
  const sections = useAtomValue(sectionsAtom);

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Course Content
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Course Curriculum</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {course.sectionCount} sections, {course.lessonCount} lessons,{' '}
            {formatDuration(course.totalDurationMinutes)} of content
          </p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {sections.map((section, sectionIndex) => (
            <SectionCard key={section.id} section={section} sectionIndex={sectionIndex} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function CourseOverviewPage() {
  const course = useAtomValue(courseAtom);
  const courseProgress = useAtomValue(courseProgressAtom);
  const firstIncompleteLesson = useAtomValue(firstIncompleteLessonAtom);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection
        course={course}
        courseProgress={courseProgress}
        firstIncompleteLesson={firstIncompleteLesson}
      />

      <WhatYoullLearn />

      <CourseCurriculum />

      {/* Bottom CTA */}
      <div className="py-16 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Start Your Songwriting Journey?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students who have transformed their musical ideas into complete songs.
          </p>
          {Option.isSome(firstIncompleteLesson) && (
            <Link to="/lesson/$lessonId" params={{ lessonId: firstIncompleteLesson.value.id }}>
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/20">
                <PlayCircle className="w-5 h-5" />
                {courseProgress.completed > 0 ? 'Continue Learning' : 'Start Course Now'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
