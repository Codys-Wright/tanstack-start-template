/**
 * Course Overview Page
 *
 * The main landing page for the Songmaking course.
 * Shows course description, sections overview, and a call to action to start learning.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Card, Progress } from '@shadcn';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  SONGMAKING_COURSE,
  SONGMAKING_SECTIONS,
  getSectionLessons,
  MOCK_PROGRESS,
} from '../data/course.js';

export const Route = createFileRoute('/')({
  component: CourseOverviewPage,
});

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
}

function CourseOverviewPage() {
  const course = SONGMAKING_COURSE;

  // Calculate progress
  const totalLessons = course.lessonCount;
  const completedLessons = Array.from(MOCK_PROGRESS.values()).filter(
    (p) => p.status === 'completed',
  ).length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Find first incomplete lesson to continue
  const allLessons = SONGMAKING_SECTIONS.flatMap((s) => getSectionLessons(s.id));
  const firstIncompleteLesson = allLessons.find((l) => {
    const progress = MOCK_PROGRESS.get(l.id);
    return !progress || progress.status !== 'completed';
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start gap-8">
            {/* Course Info */}
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3">
                {course.level.replace('-', ' ')}
              </Badge>
              <h1 className="text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-xl text-muted-foreground mb-6">{course.subtitle}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{course.sectionCount} sections</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessonCount} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.totalDurationMinutes)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {completedLessons > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Your Progress</span>
                    <span className="text-muted-foreground">
                      {completedLessons} of {totalLessons} lessons ({Math.round(progressPercent)}%)
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}

              {/* CTA Button */}
              {firstIncompleteLesson && (
                <Link to="/lesson/$lessonId" params={{ lessonId: firstIncompleteLesson.id }}>
                  <Button size="lg">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Course Thumbnail */}
            <div className="hidden lg:block w-80 aspect-video bg-muted rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <GraduationCap className="w-16 h-16 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold mb-4">About This Course</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {course.description.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Course Curriculum */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
              <div className="space-y-4">
                {SONGMAKING_SECTIONS.map((section, sectionIndex) => {
                  const lessons = getSectionLessons(section.id);
                  const completedInSection = lessons.filter(
                    (l) => MOCK_PROGRESS.get(l.id)?.status === 'completed',
                  ).length;

                  return (
                    <Card key={section.id}>
                      <Card.Header className="pb-2">
                        <div className="flex items-center justify-between">
                          <Card.Title className="text-base">
                            Section {sectionIndex + 1}: {section.title}
                          </Card.Title>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {completedInSection}/{lessons.length}
                            </span>
                            <span>-</span>
                            <span>{formatDuration(section.totalDurationMinutes)}</span>
                          </div>
                        </div>
                        {section.description && (
                          <Card.Description>{section.description}</Card.Description>
                        )}
                      </Card.Header>
                      <Card.Content className="pt-2">
                        <div className="divide-y">
                          {lessons.map((lesson, lessonIndex) => {
                            const progress = MOCK_PROGRESS.get(lesson.id);
                            const isCompleted = progress?.status === 'completed';

                            return (
                              <Link
                                key={lesson.id}
                                to="/lesson/$lessonId"
                                params={{ lessonId: lesson.id }}
                                className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors first:pt-0 last:pb-0"
                              >
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      {lessonIndex + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.isFree && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Free
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.durationMinutes}m</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </Card.Content>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Course Details</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium capitalize">{course.level.replace('-', ' ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-medium">{formatDuration(course.totalDurationMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sections</span>
                  <span className="font-medium">{course.sectionCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lessons</span>
                  <span className="font-medium">{course.lessonCount}</span>
                </div>
              </Card.Content>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <Card.Header>
                <Card.Title className="text-base">What You'll Learn</Card.Title>
              </Card.Header>
              <Card.Content>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Write compelling melodies and chord progressions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Craft meaningful lyrics that connect with listeners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Understand song structure and arrangement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Record and produce your own demos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Develop a consistent creative practice</span>
                  </li>
                </ul>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
