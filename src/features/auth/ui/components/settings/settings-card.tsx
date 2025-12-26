import { Card, cn } from "@shadcn";

export interface SettingsCardProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * SettingsCard - Base component for all settings cards
 *
 * Provides consistent styling and layout for account settings sections.
 */
export function SettingsCard({ className, children }: SettingsCardProps) {
  return <Card className={cn("border-2", className)}>{children}</Card>;
}
