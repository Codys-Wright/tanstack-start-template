import { Card } from "@shadcn";
import { KeyIcon, PlusIcon } from "lucide-react";

export interface ApiKeysCardProps {
  className?: string;
}

export function ApiKeysCard({ className }: ApiKeysCardProps) {
  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ""}`}>
      {/* TODO: Implement API key listing and management */}
      {/* - Fetch user's API keys from backend */}
      {/* - Display keys with creation dates, last used, etc. */}
      {/* - Add key creation functionality */}
      {/* - Add key deletion with confirmation */}
      {/* - Add key regeneration/rotation */}

      <ApiKeyListCard />
      <CreateApiKeyCard />
    </div>
  );
}

// API Key List Card
function ApiKeyListCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <KeyIcon className="size-5" />
          Your API Keys
        </Card.Title>
        <Card.Description>
          Manage your API keys for programmatic access.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {/* TODO: List user's API keys */}
        {/* - Show key name, creation date, last used */}
        {/* - Copy key value (masked) */}
        {/* - Delete key with confirmation */}
        {/* - Show permissions/scopes */}
        {/* - Handle empty state */}
        <div className="text-center py-8 text-muted-foreground">
          <KeyIcon className="mx-auto size-8 mb-2" />
          <p>API key management coming soon...</p>
          <p className="text-sm mt-1">Create, view, and manage API keys.</p>
        </div>
      </Card.Content>
    </Card>
  );
}

// Create API Key Card
function CreateApiKeyCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <PlusIcon className="size-5" />
          Create API Key
        </Card.Title>
        <Card.Description>
          Generate a new API key for programmatic access.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {/* TODO: API key creation form */}
        {/* - Key name input */}
        {/* - Permission/role selection */}
        {/* - Expiration date (optional) */}
        {/* - Create key API call */}
        {/* - Show generated key (one-time display) */}
        {/* - Copy to clipboard functionality */}
        <div className="text-center py-8 text-muted-foreground">
          <PlusIcon className="mx-auto size-8 mb-2" />
          <p>API key creation coming soon...</p>
          <p className="text-sm mt-1">Generate secure API access tokens.</p>
        </div>
      </Card.Content>
    </Card>
  );
}

// TODO: Create ApiKeyCell component for individual key display
// TODO: Create CreateApiKeyDialog component for key creation modal
