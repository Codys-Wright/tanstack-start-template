import { Button, Card } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { UserPlusIcon, CheckIcon, XIcon, BuildingIcon, ClockIcon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms.js';
import {
  invitationsAtom,
  acceptInvitationAtom,
  cancelInvitationAtom,
} from '@auth/features/organization/client/atoms.js';
import { toast } from 'sonner';

export interface UserInvitationsCardProps {
  className?: string;
}

export function UserInvitationsCard({ className }: UserInvitationsCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const invitationsResult = useAtomValue(invitationsAtom);

  const user = Result.builder(sessionResult)
    .onSuccess((s) => s?.user)
    .orNull();

  const isPending = Result.isInitial(invitationsResult) && invitationsResult.waiting;
  const invitations = Result.builder(invitationsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  if (!user) return null;

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <UserPlusIcon className="size-5" />
          Organization Invitations
        </Card.Title>
        <Card.Description>
          Pending organization invitations you can accept or decline.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {isPending ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlusIcon className="mx-auto size-8 mb-2" />
            <p>No pending invitations.</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation: any) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

interface InvitationCardProps {
  invitation: any;
}

function InvitationCard({ invitation }: InvitationCardProps) {
  const [acceptResult, accept] = useAtom(acceptInvitationAtom);
  const [cancelResult, cancel] = useAtom(cancelInvitationAtom);

  const handleAccept = async () => {
    await accept({ invitationId: invitation.id });
    toast.success('Invitation accepted');
  };

  const handleDecline = async () => {
    await cancel({ invitationId: invitation.id });
    toast.success('Invitation declined');
  };

  const isProcessing = acceptResult.waiting || cancelResult.waiting;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BuildingIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{invitation.organizationName || 'Organization'}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            You've been invited to join as <span className="font-medium">{invitation.role}</span>
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <ClockIcon className="size-3" />
            <span>Expires {formatDate(invitation.expiresAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => void handleAccept()}
          disabled={isProcessing}
          size="sm"
          className="flex-1"
        >
          <CheckIcon className="size-4 mr-1" />
          {isProcessing ? 'Accepting...' : 'Accept'}
        </Button>
        <Button
          onClick={() => void handleDecline()}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <XIcon className="size-4 mr-1" />
          Decline
        </Button>
      </div>
    </div>
  );
}
