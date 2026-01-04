import { Button, Card, cn } from '@shadcn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { getColorByEndingName } from '@quiz/features/active-quiz/components/artist-type/artist-data-utils.js';

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

  // Split choices into two rows for mobile: first 6 (0-5), then 5 (6-10)
  const firstRowChoices = choices.slice(0, 6);
  const secondRowChoices = choices.slice(6);

  const handleRatingClick = (rating: number) => {
    onRatingSelect(rating);
    // Auto-advance after a short delay (only if enabled)
    if (autoAdvanceEnabled && canGoNext && !isLastQuestion) {
      setTimeout(() => onNext?.(), 120);
    }
  };

  // Create ideal dots overlay for secondary answers positioned above rating buttons
  // Note: This overlay is designed for desktop single-row layout
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
  // Note: This overlay is designed for desktop single-row layout
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

  // Shared button styles for rating buttons
  const getRatingButtonClasses = (isSelected: boolean) =>
    cn(
      // Base styles - large touch targets for mobile
      'rounded-lg border-2 font-semibold transition-all active:scale-95',
      // Mobile: compact but touchable buttons
      'h-12 text-base',
      // Desktop: same size
      'md:h-12 md:text-base',
      // Selected state
      isSelected
        ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]'
        : 'bg-background hover:bg-accent hover:border-accent-foreground/20 border-border',
    );

  return (
    <div className="flex flex-col w-full max-w-3xl h-full md:min-h-0">
      {/* Question Title - Takes up more vertical space, pushes card to bottom */}
      <div className="flex-1 flex items-center justify-center py-2 md:py-12 min-h-0">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-snug text-center px-4">
          {title ?? content}
        </h2>
      </div>

      {/* Card and Navigation - pinned to bottom area */}
      <div className="flex flex-col gap-2 md:gap-6">
        <Card className="gap-0 w-full animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl border border-border/60 bg-card ring-1 ring-ring/10">
          <Card.Content className="flex flex-col gap-2 md:gap-5 p-3 md:p-8">
            {/* Min Label - Top left, smaller text */}
            <div className="text-xs md:text-sm text-muted-foreground">
              <span>{minLabel}</span>
            </div>

            {/* Rating Buttons - Mobile: 2 rows (6+5 centered), Desktop: single row of 11 */}
            <div className="flex flex-col gap-2">
              {/* Mobile Layout: Two rows */}
              <div className="flex flex-col gap-2 md:hidden">
                {/* First row: 0-5 */}
                <div className="grid grid-cols-6 gap-2">
                  {firstRowChoices.map((n) => {
                    const isSelected = selectedValues.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleRatingClick(n)}
                        className={getRatingButtonClasses(isSelected)}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {/* Second row: 6-10 (centered using flex) */}
                <div className="flex justify-center gap-2">
                  {secondRowChoices.map((n) => {
                    const isSelected = selectedValues.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleRatingClick(n)}
                        className={cn(
                          getRatingButtonClasses(isSelected),
                          'w-[calc((100%-2rem)/6)]',
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Layout: Single row with ideal answer overlays */}
              <div className="hidden md:block">
                <div className="flex flex-1 items-center relative">
                  {/* Ideal Answers Overlay positioned above rating buttons */}
                  {renderIdealDots()}

                  {/* Primary Answer Bars positioned below rating buttons */}
                  {renderPrimaryBars()}

                  <div className="grid w-full grid-cols-11 gap-2">
                    {choices.map((n) => {
                      const isSelected = selectedValues.includes(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleRatingClick(n)}
                          className={getRatingButtonClasses(isSelected)}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Max Label - Bottom right, smaller text */}
            <div className="text-xs md:text-sm text-muted-foreground text-right">
              <span>{maxLabel}</span>
            </div>
          </Card.Content>
        </Card>

        {/* Navigation Buttons - below card */}
        <div className="grid grid-cols-2 gap-3 pt-4 md:pt-4 md:pb-8">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={!canGoBack}
            onClick={onBack}
            className="h-12 text-base font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          {canGoNext && !isLastQuestion ? (
            <Button type="button" size="lg" onClick={onNext} className="h-12 text-base font-medium">
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={onSubmit}
              className="h-14 md:h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white"
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
