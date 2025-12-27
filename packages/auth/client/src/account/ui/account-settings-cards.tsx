import { cn } from "@shadcn";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { sessionAtom } from "../session.atoms.js";
import { UpdateNameCard } from "./update-name-card.js";
import { UpdateAvatarCard } from "./update-avatar-card.js";
import { ChangeEmailCard } from "./change-email-card.js";

export interface AccountSettingsCardsProps {
  className?: string;
}

/**
 * AccountSettingsCards - Collection of account management cards
 *
 * Renders all account-related settings cards for the current user:
 * - Update Avatar
 * - Update Name
 * - Change Email
 *
 * Cards are always shown since we have these fields enabled.
 */
export function AccountSettingsCards({ className }: AccountSettingsCardsProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const session = Result.builder(sessionResult)
    .onSuccess((value) => value)
    .orNull();
  const user = session?.user || null;

  // Don't render if no user
  if (!user) return null;

  return (
    <div className={cn("flex w-full flex-col gap-4 md:gap-6", className)}>
      {/* Update Avatar Card */}
      <UpdateAvatarCard />

      {/* Update Name Card */}
      <UpdateNameCard />

      {/* Change Email Card */}
      <ChangeEmailCard />
    </div>
  );
}
