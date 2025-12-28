import { cn } from "@shadcn";
import React from "react";

// 1) QuizProgressBar Component - Displays a visual progress indicator for quiz questions
//    Shows clickable question indicators with progress overlay and category-based colors
//
//    Usage Examples:
//    - Default artist type colors: <QuizProgressBar questions={questions} currentIndex={0} onQuestionClick={handleClick} />
//    - Custom color scheme: <QuizProgressBar questions={questions} currentIndex={0} onQuestionClick={handleClick} categoryColorClass={myColorFunction} />
//
//    Custom Color Function Example:
//    const myColorFunction = (category?: string, colorOn?: boolean) => {
//      if (!colorOn) return "bg-muted";
//      if (category?.includes("math")) return "bg-blue-500/20";
//      if (category?.includes("science")) return "bg-green-500/20";
//      return "bg-gray-500/20";
//    };
type QuizProgressBarProps = {
  // Question data
  questions: Array<{
    id: number;
    category?: string;
  }>;

  // Current state
  currentIndex: number;

  // Callbacks
  onQuestionClick: (index: number) => void;

  // Configuration
  categoryColorClass?: (category?: string, colorOn?: boolean, questionIndex?: number) => string;
  colorOn?: boolean;
};

export const QuizProgressBar: React.FC<QuizProgressBarProps> = ({
  categoryColorClass: providedCategoryColorClass,
  colorOn = true,
  currentIndex,
  onQuestionClick,
  questions,
}) => {
  // Default category color class function (for artist types)
  const defaultCategoryColorClass = (
    _category?: string,
    colorOnParam?: boolean,
    questionIndex?: number,
  ): string => {
    const isColorOn = colorOnParam ?? colorOn;
    if (!isColorOn) return "bg-white dark:bg-black";

    // Map question index to artist type (0-based index)
    const artistTypes = [
      "visionary",
      "consummate",
      "analyzer",
      "tech",
      "entertainer",
      "maverick",
      "dreamer",
      "feeler",
      "tortured",
      "solo",
    ];

    // Use question index to determine artist type, cycling through if there are more than 10 questions
    const artistTypeIndex = (questionIndex ?? 0) % artistTypes.length;
    const artistType = artistTypes[artistTypeIndex];

    // Use CSS variables for artist type colors with subtle background tinting
    switch (artistType) {
      case "visionary":
        return "bg-[var(--artist-visionary)]/5";
      case "consummate":
        return "bg-[var(--artist-consummate)]/5";
      case "analyzer":
        return "bg-[var(--artist-analyzer)]/5";
      case "tech":
        return "bg-[var(--artist-tech)]/5";
      case "entertainer":
        return "bg-[var(--artist-entertainer)]/5";
      case "maverick":
        return "bg-[var(--artist-maverick)]/5";
      case "dreamer":
        return "bg-[var(--artist-dreamer)]/5";
      case "feeler":
        return "bg-[var(--artist-feeler)]/5";
      case "tortured":
        return "bg-[var(--artist-tortured)]/5";
      case "solo":
        return "bg-[var(--artist-solo)]/5";
      default:
        return "bg-white dark:bg-black";
    }
  };

  // Use provided function or default
  const categoryColorClass = providedCategoryColorClass ?? defaultCategoryColorClass;

  // Remove opacity effects for clean, solid appearance
  const lightenClassForIndex = (_idx: number): string => {
    return "";
  };

  return (
    <div className="relative w-full">
      <div
        className="grid gap-0 overflow-hidden rounded-sm"
        style={{
          gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))`,
        }}
      >
        {questions.map((q, idx) => (
          <button
            key={q.id}
            type="button"
            title={`Q${idx + 1}${(q.category ?? "").length > 0 ? ` · ${q.category ?? ""}` : ""}`}
            onClick={() => {
              onQuestionClick(idx);
            }}
            className={cn(
              "h-3 focus:outline-none transition-[filter,background-color,opacity] duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring/40",
              categoryColorClass(q.category, colorOn, idx),
              lightenClassForIndex(idx),
            )}
          />
        ))}
      </div>
      {/* Progress overlay - snaps to sections */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="grid gap-0 h-full"
          style={{
            gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))`,
          }}
        >
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-full transition-all duration-200",
                idx <= currentIndex ? "bg-foreground/20" : "bg-transparent",
                // Round left side of first section, round right side of last completed section
                idx === 0 && currentIndex >= 0 ? "rounded-l-sm" : "",
                idx === currentIndex && currentIndex >= 0 ? "rounded-r-sm" : "",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
