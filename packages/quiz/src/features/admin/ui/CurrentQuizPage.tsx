'use client';

import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import { IconCheck, IconPlayerPlay } from '@tabler/icons-react';
import * as React from 'react';

import { AlertDialog, Badge, Button, Card, Select, Skeleton } from '@shadcn';
import { enginesAtom } from '@quiz/features/analysis-engine/client/atoms.js';
import { quizzesAtom, toggleQuizPublishAtom } from '@quiz/features/quiz/client/atoms.js';

/**
 * CurrentQuizPage - Manage which quiz and engine are live on the website
 */
export const CurrentQuizPage: React.FC = () => {
  const quizzesResult = useAtomValue(quizzesAtom);
  const enginesResult = useAtomValue(enginesAtom);
  const toggleQuizPublish = useAtomSet(toggleQuizPublishAtom, {
    mode: 'promise',
  });

  const [selectedQuizId, setSelectedQuizId] = React.useState<string>('');
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Get non-temp quizzes only (permanent versions)
  const availableQuizzes = React.useMemo(() => {
    if (!Result.isSuccess(quizzesResult)) return [];
    return quizzesResult.value
      .filter((q) => !q.isTemp && q.title === 'My Artist Type Quiz')
      .sort((a, b) => b.version.semver.localeCompare(a.version.semver));
  }, [quizzesResult]);

  // Get the currently published quiz
  const currentlyPublishedQuiz = React.useMemo(() => {
    if (!Result.isSuccess(quizzesResult)) return undefined;
    return quizzesResult.value.find((q) => q.isPublished && !q.isTemp);
  }, [quizzesResult]);

  // Get the engine associated with the selected quiz
  const selectedQuizEngine = React.useMemo(() => {
    if (!Result.isSuccess(enginesResult) || !selectedQuizId) return undefined;
    return enginesResult.value.find((e) => e.quizId === selectedQuizId && !e.isTemp);
  }, [enginesResult, selectedQuizId]);

  // Get the currently published engine
  const currentlyPublishedEngine = React.useMemo(() => {
    if (!Result.isSuccess(enginesResult)) return undefined;
    return enginesResult.value.find((e) => e.isPublished && !e.isTemp);
  }, [enginesResult]);

  // Set initial selection to currently published quiz
  React.useEffect(() => {
    if (currentlyPublishedQuiz && !selectedQuizId) {
      setSelectedQuizId(currentlyPublishedQuiz.id);
    }
  }, [currentlyPublishedQuiz, selectedQuizId]);

  const selectedQuiz = availableQuizzes.find((q) => q.id === selectedQuizId);
  const isCurrentlyPublished = selectedQuiz?.isPublished === true;

  const handlePublish = async () => {
    if (!selectedQuiz) return;

    setIsPublishing(true);
    try {
      // First, unpublish the currently published quiz if different
      if (currentlyPublishedQuiz && currentlyPublishedQuiz.id !== selectedQuiz.id) {
        await toggleQuizPublish({
          quiz: currentlyPublishedQuiz,
          isPublished: false,
        });
      }

      // Publish the selected quiz
      await toggleQuizPublish({
        quiz: selectedQuiz,
        isPublished: true,
      });

      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to publish quiz:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const isLoading = !Result.isSuccess(quizzesResult) || !Result.isSuccess(enginesResult);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Current Quiz</h1>
        <p className="text-muted-foreground">
          Select which quiz version is live on the website. The associated engine will be used for
          analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Currently Live Card */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <IconPlayerPlay className="h-5 w-5 text-green-500" />
              Currently Live
            </Card.Title>
            <Card.Description>The quiz version currently serving users</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            {currentlyPublishedQuiz ? (
              <>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currentlyPublishedQuiz.title}</span>
                    <Badge variant="default" className="bg-green-500">
                      Live
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Version: v{currentlyPublishedQuiz.version.semver}
                  </div>
                  {currentlyPublishedQuiz.version.comment && (
                    <div className="text-sm text-muted-foreground">
                      {currentlyPublishedQuiz.version.comment}
                    </div>
                  )}
                </div>
                {currentlyPublishedEngine && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Analysis Engine</span>
                      <Badge variant="outline">v{currentlyPublishedEngine.version.semver}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentlyPublishedEngine.name}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                No quiz is currently published
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Select New Version Card */}
        <Card>
          <Card.Header>
            <Card.Title>Select Version</Card.Title>
            <Card.Description>Choose a quiz version to make live</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Version</label>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <Select.Trigger>
                  <Select.Value placeholder="Select a quiz version" />
                </Select.Trigger>
                <Select.Content>
                  {availableQuizzes.map((quiz) => (
                    <Select.Item key={quiz.id} value={quiz.id}>
                      <div className="flex items-center gap-2">
                        <span>v{quiz.version.semver}</span>
                        {quiz.isPublished && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            Live
                          </Badge>
                        )}
                        {quiz.version.comment && (
                          <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                            - {quiz.version.comment}
                          </span>
                        )}
                      </div>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {selectedQuiz && selectedQuizEngine && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="text-sm font-medium">Associated Engine</div>
                <div className="text-sm text-muted-foreground">
                  {selectedQuizEngine.name} (v
                  {selectedQuizEngine.version.semver})
                </div>
              </div>
            )}

            {selectedQuiz && !selectedQuizEngine && (
              <div className="p-4 bg-destructive/10 rounded-lg text-sm text-destructive">
                Warning: No engine is associated with this quiz version
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedQuiz || isCurrentlyPublished || isPublishing}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isCurrentlyPublished ? (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Already Live
                </>
              ) : (
                <>
                  <IconPlayerPlay className="h-4 w-4 mr-2" />
                  Make Live
                </>
              )}
            </Button>
          </Card.Content>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Confirm Publish</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to make <strong>v{selectedQuiz?.version.semver}</strong> the
              live version?
              {currentlyPublishedQuiz && currentlyPublishedQuiz.id !== selectedQuiz?.id && (
                <span className="block mt-2">
                  This will replace the current live version (v
                  {currentlyPublishedQuiz.version.semver}).
                </span>
              )}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={isPublishing}>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? 'Publishing...' : 'Make Live'}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};
