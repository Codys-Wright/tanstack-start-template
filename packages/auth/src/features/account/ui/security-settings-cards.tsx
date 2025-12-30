import { Card } from '@shadcn';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { ShieldIcon, KeyIcon, ClockIcon, SmartphoneIcon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms';
import { SettingsCard } from './settings-card';

export interface SecuritySettingsCardsProps {
  className?: string;
}

export function SecuritySettingsCards({ className }: SecuritySettingsCardsProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const user = Result.isSuccess(sessionResult) ? sessionResult.value?.user : null;

  if (!user) return null;

  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ''}`}>
      {/* Change Password Card */}
      <ChangePasswordCard />

      {/* Active Sessions Card */}
      <ActiveSessionsCard />

      {/* Two-Factor Authentication Card */}
      <TwoFactorCard />

      {/* API Keys Card */}
      <ApiKeysCard />
    </div>
  );
}

// Change Password Card
function ChangePasswordCard() {
  return (
    <SettingsCard>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <KeyIcon className="size-5" />
          Change Password
        </Card.Title>
        <Card.Description>Update your password to keep your account secure.</Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <KeyIcon className="mx-auto size-8 mb-2" />
          <p>Password change functionality coming soon...</p>
          <p className="text-sm mt-1">For now, use the forgot password feature if needed.</p>
        </div>
      </Card.Content>
    </SettingsCard>
  );
}

// Active Sessions Card
function ActiveSessionsCard() {
  return (
    <SettingsCard>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ClockIcon className="size-5" />
          Active Sessions
        </Card.Title>
        <Card.Description>Manage your active login sessions across devices.</Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <ClockIcon className="mx-auto size-8 mb-2" />
          <p>Session management coming soon...</p>
          <p className="text-sm mt-1">View and revoke access from other devices.</p>
        </div>
      </Card.Content>
    </SettingsCard>
  );
}

// Two-Factor Authentication Card
function TwoFactorCard() {
  return (
    <SettingsCard>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <SmartphoneIcon className="size-5" />
          Two-Factor Authentication
        </Card.Title>
        <Card.Description>
          Add an extra layer of security to your account with 2FA.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <SmartphoneIcon className="mx-auto size-8 mb-2" />
          <p>Two-factor authentication coming soon...</p>
          <p className="text-sm mt-1">Use authenticator apps or SMS for added security.</p>
        </div>
      </Card.Content>
    </SettingsCard>
  );
}

// API Keys Card
function ApiKeysCard() {
  return (
    <SettingsCard>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ShieldIcon className="size-5" />
          API Keys
        </Card.Title>
        <Card.Description>
          Manage API keys for programmatic access to your account.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <ShieldIcon className="mx-auto size-8 mb-2" />
          <p>API key management coming soon...</p>
          <p className="text-sm mt-1">Generate and manage secure API access tokens.</p>
        </div>
      </Card.Content>
    </SettingsCard>
  );
}
