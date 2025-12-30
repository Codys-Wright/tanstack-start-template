import { Button, Card, Input, Badge, cn } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { UsersIcon, UserPlusIcon, TrashIcon, ShieldIcon, CrownIcon, UserIcon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms.js';
import {
  organizationsAtom,
  organizationMembersAtom,
  inviteMemberAtom,
  removeMemberAtom,
} from '@auth/features/organization/client/atoms.js';
import { useForm } from '@tanstack/react-form';
import * as Schema from 'effect/Schema';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

// Validation schema
const InviteMemberSchema = Schema.Struct({
  email: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => 'Email is required' }),
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => 'Please enter a valid email',
    }),
  ),
  role: Schema.Literal('owner', 'admin', 'member'),
});

export interface OrganizationMembersCardProps {
  className?: string;
}

/**
 * OrganizationMembersCard - Displays and manages organization members
 */
export function OrganizationMembersCard({ className }: OrganizationMembersCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const orgsResult = useAtomValue(organizationsAtom);

  const session = Result.builder(sessionResult)
    .onSuccess((value) => value)
    .orNull();
  const activeOrgId = session?.session?.activeOrganizationId;

  const organizations = Result.builder(orgsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  const activeOrg = organizations.find((org: any) => org.id === activeOrgId);

  // Dynamically create members atom for the active org
  const membersAtom = useMemo(
    () => organizationMembersAtom(activeOrgId || undefined),
    [activeOrgId],
  );
  const membersResult = useAtomValue(membersAtom) as Result.Result<any[], unknown>;

  const isPending = Result.isInitial(membersResult) && membersResult.waiting;
  const members = Result.builder(membersResult)
    .onSuccess((v) => v)
    .orElse(() => [] as any[]);

  if (!session?.user) return null;

  if (!activeOrg) {
    return (
      <Card className={className}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Members
          </Card.Title>
          <Card.Description>No active organization selected.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-center py-8 text-muted-foreground">
            Please select an organization to view its members.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
      {/* Members List */}
      <MembersListCard
        members={members}
        loading={isPending}
        currentUserId={session.user.id}
        organizationId={activeOrgId!}
      />

      {/* Invite Member */}
      <InviteMemberCard organizationId={activeOrgId!} />
    </div>
  );
}

// ============================================================================
// Members List Card
// ============================================================================

interface MembersListCardProps {
  members: any[];
  loading: boolean;
  currentUserId: string;
  organizationId: string;
}

function MembersListCard({
  members,
  loading,
  currentUserId,
  organizationId,
}: MembersListCardProps) {
  const [removeResult, removeMember] = useAtom(removeMemberAtom);
  const isProcessing = removeResult.waiting;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <CrownIcon className="size-4 text-yellow-500" />;
      case 'admin':
        return <ShieldIcon className="size-4 text-blue-500" />;
      default:
        return <UserIcon className="size-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleRemove = async (memberIdOrEmail: string) => {
    try {
      await removeMember({ memberIdOrEmail, organizationId });
      toast.success('Member removed');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <UsersIcon className="size-5" />
          Organization Members
        </Card.Title>
        <Card.Description>View and manage members of your organization.</Card.Description>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UsersIcon className="mx-auto size-8 mb-2" />
            <p>No members found.</p>
            <p className="text-sm mt-1">Invite members to your organization below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {member.user?.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || member.user.email}
                        className="size-full object-cover"
                      />
                    ) : (
                      <UserIcon className="size-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.user?.name || member.user?.email || 'Unknown'}
                      </p>
                      {member.userId === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                </div>

                {/* Role & Actions */}
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                    {getRoleIcon(member.role)}
                    {member.role}
                  </Badge>

                  {/* Can't remove yourself or owners */}
                  {member.userId !== currentUserId && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleRemove(member.id)}
                      disabled={isProcessing}
                    >
                      <TrashIcon className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Invite Member Card
// ============================================================================

interface InviteMemberCardProps {
  organizationId: string;
}

function InviteMemberCard({ organizationId }: InviteMemberCardProps) {
  const [inviteResult, inviteMember] = useAtom(inviteMemberAtom);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member');
  const isInviting = inviteResult.waiting;

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const decoded = Schema.decodeSync(InviteMemberSchema)({
          email: value.email,
          role: selectedRole,
        });
        await inviteMember({
          email: decoded.email,
          role: decoded.role,
          organizationId,
        });
        form.reset();
        toast.success('Invitation sent');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
  });

  const error = Result.builder(inviteResult)
    .onFailure((failure) => String(failure))
    .orNull();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <UserPlusIcon className="size-5" />
          Invite Member
        </Card.Title>
        <Card.Description>Send an invitation to join your organization.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <form.Field name="email">
              {(fieldApi) => (
                <div className="flex-1 space-y-2">
                  <label htmlFor={fieldApi.name} className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id={fieldApi.name}
                    type="email"
                    value={fieldApi.state.value}
                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                    placeholder="member@example.com"
                  />
                </div>
              )}
            </form.Field>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="flex gap-2">
                {(['member', 'admin', 'owner'] as const).map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={selectedRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                    className="capitalize"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isInviting}>
            {isInviting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
