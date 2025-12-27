import { Card, cn } from '@shadcn';

export interface SettingsCardProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * SettingsCard - Wrapper component for settings cards
 *
 * Provides consistent styling for all settings-related cards
 */
export function SettingsCard({ className, children }: SettingsCardProps) {
  return <Card className={cn('w-full', className)}>{children}</Card>;
}
