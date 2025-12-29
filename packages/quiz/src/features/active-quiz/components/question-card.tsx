import { Button, Card, cn } from '@shadcn';
import React from 'react';
import { getColorByEndingName } from './artist-type/artist-data-utils.js';

// 1) QuestionCard Component - Displays a single question with rating input and navigation
//    Receives all data and callbacks as props to remain dumb and testable
type IdealAnswer = {
  endingId: string;
  endingName: string;
  idealAnswers: Array<number>;
  isPrimary: boolean;
};

type QuestionCardProps = {
  // Question data
  content?: string;
  title?: string;
  minLabel?: string;
  maxLabel?: string;

  // Rating configuration
  min?: number;
  max?: number;

  // Current state
  selectedValues?: Array<number>; // For multiple selections - derived from atom data

  // Ideal answers for overlay
  idealAnswers?: Array<IdealAnswer>;
  showIdealAnswers?: boolean;

  // Callbacks
  onRatingSelect: (rating: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;

  // Navigation state
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastQuestion?: boolean;

  // Auto-advance setting
  autoAdvanceEnabled?: boolean;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  autoAdvanceEnabled = true,
  canGoBack = true,
  canGoNext = true,
  content,
  idealAnswers,
  isLastQuestion = false,
  max = 10,
  maxLabel = 'Max',
  min = 0,
  minLabel = 'Min',
  onBack,
  onNext,
  onRatingSelect,
  onSubmit,
  selectedValues = [],
  showIdealAnswers = true,
  title,
}) => {
  // Generate rating choices from min to max (inclusive)
  const choices = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const handleRatingClick = (rating: number) => {
    onRatingSelect(rating);
    // Auto-advance after a short delay (only if enabled)
    if (autoAdvanceEnabled && canGoNext && !isLastQuestion) {
      setTimeout(() => onNext?.(), 120);
    }
  };

  // Create ideal dots overlay for secondary answers positioned above rating buttons
  const renderIdealDots = () => {
    if (!showIdealAnswers || idealAnswers === undefined || idealAnswers.length === 0) return null;

    // Filter for secondary answers only (isPrimary: false)
    const secondaryAnswers = idealAnswers.filter((answer) => !answer.isPrimary);

    if (secondaryAnswers.length === 0) return null;

    // Group answers by ideal value
    const answersByValue = new Map<number, typeof secondaryAnswers>();
    secondaryAnswers.forEach((answer) => {
      answer.idealAnswers.forEach((idealValue) => {
        if (!answersByValue.has(idealValue)) {
          answersByValue.set(idealValue, []);
        }
        answersByValue.get(idealValue)?.push(answer);
      });
    });

    return (
      <>
        {Array.from(answersByValue.entries()).map(([idealValue, answers]) => {
          if (answers.length === 0) {
            return null;
          }

          // Calculate position above the specific button
          const buttonIndex = idealValue - min;
          const buttonWidth = 100 / (max - min + 1); // Percentage width per button
          const leftPosition = buttonIndex * buttonWidth + buttonWidth / 2; // Center of button

          return (
            <div
              key={idealValue}
              className="absolute top-[-30px] transform -translate-x-1/2 pointer-events-none"
              style={{ left: `${leftPosition}%` }}
            >
              {/* 3x3 grid for multiple dots - all positioned above the card */}
              <div className="grid grid-cols-3 gap-0.5 w-6 h-6">
                {answers.slice(0, 9).map((answer, index) => {
                  return (
                    <div
                      key={`${answer.endingId}-${idealValue}-${index}`}
                      className="w-1.5 h-1.5 rounded-full border border-white/30 shadow-sm"
                      style={{
                        backgroundColor: getColorByEndingName(answer.endingName),
                      }}
                      title={`${answer.endingName}: ${idealValue}`}
                    />
                  );
                })}
                {/* Show "+" if more than 9 answers */}
                {answers.length > 9 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 border border-white/30 shadow-sm flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">+</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Create primary answer bars positioned below rating buttons
  const renderPrimaryBars = () => {
    if (!showIdealAnswers || idealAnswers === undefined || idealAnswers.length === 0) return null;

    // Filter for primary answers only (isPrimary: true)
    const primaryAnswers = idealAnswers.filter((answer) => answer.isPrimary);

    if (primaryAnswers.length === 0) return null;

    // Group primary answers by their ending to get the color
    const answersByEnding = new Map<string, typeof primaryAnswers>();
    primaryAnswers.forEach((answer) => {
      if (!answersByEnding.has(answer.endingId)) {
        answersByEnding.set(answer.endingId, []);
      }
      answersByEnding.get(answer.endingId)?.push(answer);
    });

    return (
      <>
        {Array.from(answersByEnding.entries()).map(([endingId, answers]) => {
          if (answers.length === 0) {
            return null;
          }

          // Get the first answer to get the ending name and color
          const [firstAnswer] = answers;
          const endingName = firstAnswer?.endingName;
          const barColor = getColorByEndingName(endingName ?? '');

          // Collect all ideal values for this ending
          const allValues = new Set<number>();
          answers.forEach((answer) => {
            answer.idealAnswers.forEach((value) => allValues.add(value));
          });

          // Sort the values
          const sortedValues = Array.from(allValues).sort((a, b) => a - b);

          if (sortedValues.length === 0) return null;

          // Group consecutive values into ranges
          const ranges: Array<Array<number>> = [];
          const firstValue = sortedValues[0];
          if (firstValue === undefined) return null;
          let currentRange: Array<number> = [firstValue];

          for (let i = 1; i < sortedValues.length; i++) {
            const current = sortedValues[i];
            const prev = sortedValues[i - 1];
            if (current === undefined || prev === undefined) continue;
            if (current === prev + 1) {
              // Consecutive, add to current range
              currentRange.push(current);
            } else {
              // Not consecutive, start new range
              ranges.push(currentRange);
              currentRange = [current];
            }
          }
          ranges.push(currentRange); // Add the last range

          return ranges.map((range, rangeIndex) => {
            if (range.length === 0) return null;
            const startValue = range[0];
            const endValue = range[range.length - 1];
            if (startValue === undefined || endValue === undefined) return null;

            // Calculate position and width for the bar - span full width of buttons
            const startButtonIndex = startValue - min;
            const endButtonIndex = endValue - min;
            const buttonWidth = 100 / (max - min + 1); // Percentage width per button

            // Start from left edge of first button, end at right edge of last button
            const leftPosition = startButtonIndex * buttonWidth;
            const barWidth = (endButtonIndex - startButtonIndex + 1) * buttonWidth;

            return (
              <div
                key={`primary-bar-${endingId}-${rangeIndex}`}
                className="absolute top-[52px] h-1 rounded-full pointer-events-none"
                style={{
                  left: `${leftPosition}%`,
                  width: `${barWidth}%`,
                  backgroundColor: barColor,
                  opacity: 0.8,
                }}
                title={`${endingName} primary ideal answers: ${range.join(', ')}`}
              />
            );
          });
        })}
      </>
    );
  };

  return (
    <Card className="gap-0 w-full max-w-3xl animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl border border-border/60 bg-card ring-1 ring-ring/10">
      <Card.Header className="p-4 min-h-36 flex items-center justify-center text-center">
        <Card.Title className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-center">
          {title ?? content}
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        <div className="flex flex-1 items-center relative">
          {/* Ideal Answers Overlay positioned above rating buttons */}
          {renderIdealDots()}

          {/* Primary Answer Bars positioned below rating buttons */}
          {renderPrimaryBars()}

          <div className="grid w-full grid-cols-11 gap-2">
            {choices.map((n) => {
              // Check if this rating is selected from the selectedValues array
              // This now comes directly from atom data, not local state
              const isSelected = selectedValues.includes(n);

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    handleRatingClick(n);
                  }}
                  className={cn(
                    'rounded-md border p-3 text-center text-sm transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                      : 'hover:bg-accent hover:scale-[1.01]',
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center">
          <Button type="button" variant="secondary" disabled={!canGoBack} onClick={onBack}>
            Back
          </Button>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>{minLabel}</span>
            <span className="text-muted-foreground/60">/</span>
            <span>{maxLabel}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            {canGoNext && !isLastQuestion ? (
              <Button type="button" onClick={onNext}>
                Next
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                type="button"
                onClick={onSubmit}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};
