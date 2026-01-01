'use client';

import { useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import type { Question } from '@/features/quiz/questions/schema.js';
import { Button } from '@shadcn';
import { HelpCircleIcon, SlidersIcon } from 'lucide-react';
import React from 'react';

import { leftSidebarViewAtom } from '../atoms.js';
import { type AnalysisConfig, EngineTweaks } from './engine-tweaks.js';
import { QuestionList } from './question-list.js';

export interface LeftSidebarProps {
  analysisConfig: AnalysisConfig;
  onAddQuestion: () => void;
  onAnalysisConfigChange: (config: AnalysisConfig) => void;
  onSelectQuestion: (index: number) => void;
  questions: ReadonlyArray<Question>;
  selectedQuestionIndex: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  analysisConfig,
  onAddQuestion,
  onAnalysisConfigChange,
  onSelectQuestion,
  questions,
  selectedQuestionIndex,
}) => {
  const leftSidebarView = useAtomValue(leftSidebarViewAtom);
  const setLeftSidebarView = useAtomSet(leftSidebarViewAtom);

  return (
    <div className="flex h-full flex-col border-r border-border/50 overflow-hidden">
      {/* Sidebar Header with View Switcher */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border/50">
        <h3 className="text-sm font-medium">
          {leftSidebarView === 'quiz' ? 'Quiz Editor' : 'Analysis Tools'}
        </h3>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={leftSidebarView === 'quiz' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setLeftSidebarView('quiz');
            }}
            className="gap-1 h-6 px-2 text-xs"
          >
            <HelpCircleIcon className="h-3 w-3" />
            Quiz
          </Button>
          <Button
            variant={leftSidebarView === 'analysis' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setLeftSidebarView('analysis');
            }}
            className="gap-1 h-6 px-2 text-xs"
          >
            <SlidersIcon className="h-3 w-3" />
            Analysis
          </Button>
        </div>
      </div>

      {/* Sidebar Content - flex-1 and min-h-0 needed for ScrollArea to work */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {leftSidebarView === 'quiz' ? (
          <QuestionList
            questions={questions}
            selectedIndex={selectedQuestionIndex}
            onSelectQuestion={onSelectQuestion}
            onAddQuestion={onAddQuestion}
          />
        ) : (
          <EngineTweaks analysisConfig={analysisConfig} onChange={onAnalysisConfigChange} />
        )}
      </div>
    </div>
  );
};
