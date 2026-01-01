'use client';

import { cn, ScrollArea } from '@shadcn';

import type { Question } from '@/features/quiz/questions/schema.js';

export interface QuestionListProps {
  onAddQuestion: () => void;
  onSelectQuestion: (index: number) => void;
  questions: ReadonlyArray<Question>;
  selectedIndex: number;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  onAddQuestion: _onAddQuestion,
  onSelectQuestion,
  questions,
  selectedIndex,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-1 space-y-0.5">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => {
              onSelectQuestion(index);
            }}
            className={cn(
              'w-full text-left p-1.5 rounded text-xs transition-colors',
              'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring/40',
              selectedIndex === index
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-foreground',
            )}
          >
            <div className="flex items-start gap-2 min-w-0">
              <span
                className={cn(
                  'text-xs font-mono px-1 py-0.5 rounded flex-shrink-0 mt-0.5',
                  selectedIndex === index
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-muted text-foreground',
                )}
              >
                {index + 1}
              </span>
              <span className="flex-1 min-w-0 text-xs leading-relaxed break-words">
                {question.title}
              </span>
            </div>
          </button>
        ))}
        {/* Bottom spacer to ensure last item is fully scrollable */}
        <div className="h-16" />
      </div>
    </ScrollArea>
  );
};
