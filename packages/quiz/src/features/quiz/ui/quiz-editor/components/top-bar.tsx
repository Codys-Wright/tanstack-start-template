'use client';

import { Badge, Button, cn, DropdownMenu, Select, Sidebar } from '@shadcn';
import { GitBranchIcon, SaveIcon, SettingsIcon } from 'lucide-react';
import React from 'react';

import type { AnalysisEngine } from '@/features/analysis-engine/domain/schema.js';
import type { Quiz } from '@/features/quiz/domain/schema.js';
import { VersionIncrementDialog } from '../../version-increment-dialog.js';
import { ArtistIcon } from './artist-icon.js';
import {
  artistTypes,
  getArtistTypeColorStyle,
  getDisplayVersion,
  getTempBadgeColor,
  hasQuizChanged,
} from '../utils.js';

const AdminSidebarToggle: React.FC = () => {
  return <Sidebar.Trigger className="h-8 w-8 p-0" />;
};

export interface TopBarProps {
  engines: ReadonlyArray<AnalysisEngine>;
  isLoading?: boolean;
  onArtistTypeChange: (artistType: string) => void;
  onCreateNewVersion: (
    newVersion: string,
    incrementType: 'major' | 'minor' | 'patch',
    comment?: string,
  ) => void;
  onOpenClearDraftsDialog: () => void;
  onOpenDeleteQuizDialog: () => void;
  onQuizChange: (quizId: string) => void;
  quizzes: ReadonlyArray<Quiz>;
  selectedArtistType: string;
  selectedEngineId: string;
  selectedQuizId: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  isLoading = false,
  onArtistTypeChange,
  onCreateNewVersion,
  onOpenClearDraftsDialog,
  onOpenDeleteQuizDialog,
  onQuizChange,
  quizzes,
  selectedArtistType,
  selectedQuizId,
}) => {
  // Filter to only show "My Artist Type Quiz" versions
  const artistTypeQuizVersions = quizzes
    .filter((q) => q.title === 'My Artist Type Quiz' || q.title === 'My Artist Type Quiz (Editing)')
    .sort((a, b) => b.version.semver.localeCompare(a.version.semver)); // Sort by version desc

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId);
  const hasChanges = selectedQuiz !== undefined ? hasQuizChanged(selectedQuiz, quizzes) : false;

  // Get existing versions for validation (only non-temp versions of the same quiz title)
  const existingVersions = React.useMemo(() => {
    const baseTitle = selectedQuiz?.title.replace(' (Editing)', '') ?? 'My Artist Type Quiz';
    return quizzes.filter((q) => q.title === baseTitle && !q.isTemp).map((q) => q.version.semver);
  }, [quizzes, selectedQuiz?.title]);

  // Find the highest existing version to use as the base for incrementing
  const highestExistingVersion = React.useMemo(() => {
    if (existingVersions.length === 0) return '1.0.0';
    return (
      existingVersions.sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        return bPatch - aPatch;
      })[0] ?? '1.0.0'
    );
  }, [existingVersions]);

  const [isVersionDialogOpen, setIsVersionDialogOpen] = React.useState(false);

  return (
    <>
      <VersionIncrementDialog
        currentVersion={highestExistingVersion}
        existingVersions={existingVersions}
        isOpen={isVersionDialogOpen}
        onClose={() => {
          setIsVersionDialogOpen(false);
        }}
        onConfirm={onCreateNewVersion}
        title={
          selectedQuiz !== undefined && selectedQuiz.isTemp === true
            ? 'Save Changes as New Version'
            : 'Create New Quiz Version'
        }
      />
      <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <AdminSidebarToggle />
        </div>

        <div className="flex items-center gap-6 flex-1">
          {/* Combined Version Selection - Quiz + Engine */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Version:</span>
            {isLoading ? (
              <div className="w-60 h-9 bg-muted animate-pulse rounded-md" />
            ) : (
              <Select value={selectedQuizId} onValueChange={onQuizChange}>
                <Select.Trigger className="w-60">
                  <Select.Value placeholder="Select version">
                    {selectedQuiz !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span title={selectedQuiz.version.comment ?? undefined}>
                          {getDisplayVersion(selectedQuiz, artistTypeQuizVersions)}
                        </span>
                        {selectedQuiz.isTemp ? (
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 ${getTempBadgeColor(selectedQuiz.id)}`}
                          >
                            Edit
                          </Badge>
                        ) : selectedQuiz.isPublished === true ? (
                          <Badge variant="default" className="text-xs px-1">
                            Live
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </Select.Value>
                </Select.Trigger>
                <Select.Content>
                  {artistTypeQuizVersions.map((quiz) => (
                    <Select.Item key={quiz.id} value={quiz.id}>
                      <div className="flex items-center gap-1.5">
                        <span>{getDisplayVersion(quiz, artistTypeQuizVersions)}</span>
                        {quiz.isTemp ? (
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 ${getTempBadgeColor(quiz.id)}`}
                          >
                            Edit
                          </Badge>
                        ) : quiz.isPublished ? (
                          <Badge variant="default" className="text-xs px-1">
                            Live
                          </Badge>
                        ) : null}
                      </div>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          </div>
          {/* Artist Type Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Artist Type:</span>
            <Select value={selectedArtistType} onValueChange={onArtistTypeChange}>
              <Select.Trigger
                className="w-40 border-2"
                style={getArtistTypeColorStyle(selectedArtistType)}
              >
                <Select.Value>
                  <div className="flex items-center gap-2">
                    <ArtistIcon artistType={selectedArtistType} size={16} />
                    <span className="capitalize font-medium">{selectedArtistType}</span>
                  </div>
                </Select.Value>
              </Select.Trigger>
              <Select.Content>
                {artistTypes.map((type) => (
                  <Select.Item key={type} value={type} style={getArtistTypeColorStyle(type)}>
                    <div className="flex items-center gap-2">
                      <ArtistIcon artistType={type} size={16} />
                      <span className="capitalize">{type}</span>
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {selectedQuiz !== undefined && selectedQuiz.isTemp && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsVersionDialogOpen(true);
              }}
              className="gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </Button>
          )}

          {selectedQuiz !== undefined && !selectedQuiz.isTemp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsVersionDialogOpen(true);
              }}
              disabled={!hasChanges}
              className={cn('gap-2', !hasChanges && 'opacity-50 cursor-not-allowed')}
              title={
                !hasChanges
                  ? 'No changes to save as new version'
                  : 'Create a new version with your changes'
              }
            >
              <GitBranchIcon className="h-4 w-4" />
              New Version
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="w-48">
              <DropdownMenu.Label>Settings</DropdownMenu.Label>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>
                <span>Quiz Settings</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <span>Export Quiz</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <span>Import Quiz</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <DropdownMenu.Item
                className="text-destructive"
                onClick={() => {
                  onOpenClearDraftsDialog();
                }}
              >
                <span>Clear All Drafts</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <div className="px-2 py-1">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  Danger
                </span>
              </div>

              <DropdownMenu.Item
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => {
                  onOpenDeleteQuizDialog();
                }}
              >
                <span>Delete Quiz</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};
