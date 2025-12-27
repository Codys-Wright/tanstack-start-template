import { Card, Button } from "@shadcn";
import { UsersIcon, PlusIcon, UserMinusIcon } from "lucide-react";
import { useMemo } from "react";
import { Result, useAtomValue, useAtom } from "@effect-atom/atom-react";
import { toast } from "sonner";
import { teamMembersAtom, removeTeamMemberAtom } from "../../organization";
import { sessionAtom } from "../../session/session.atoms.js";
import { AddTeamMemberDialog } from "./add-team-member-dialog.js";
import { useTeamPermissions } from "../use-team-permissions.js";
import type { Team } from "@auth/domain";

export interface TeamMembersCardProps {
  team: Team;
  className?: string;
}

export function TeamMembersCard({ team, className }: TeamMembersCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const user = Result.isSuccess(sessionResult)
    ? sessionResult.value?.user
    : null;

  const permissions = useTeamPermissions();
  const [removeResult, removeMember] = useAtom(removeTeamMemberAtom);

  // Create atom for current team members (memoized to prevent recreation)
  const currentTeamMembersAtom = useMemo(
    () => teamMembersAtom(team.id),
    [team.id],
  );
  const membersResult = useAtomValue(currentTeamMembersAtom);

  const isPending = Result.isInitial(membersResult) && membersResult.waiting;
  const members = Result.builder(membersResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  const handleRemoveMember = (memberId: string) => {
    try {
      removeMember({
        teamId: team.id,
        userId: memberId,
      });
      toast.success("Member removed from team");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to remove member");
      }
    }
  };

  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ""}`}>
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title className="flex items-center gap-2">
                <UsersIcon className="size-5" />
                Team Members
              </Card.Title>
              <Card.Description>
                Manage members of the {team.name} team.
              </Card.Description>
            </div>
            <AddTeamMemberDialog team={team}>
              <Button
                size="sm"
                className="gap-2"
                disabled={!permissions.canManageMembers}
              >
                <PlusIcon className="size-4" />
                Add Member
              </Button>
            </AddTeamMemberDialog>
          </div>
        </Card.Header>
        <Card.Content>
          {isPending ? (
            <div className="space-y-3">
              {/* Skeleton loading state */}
              {["member-1", "member-2", "member-3"].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="mx-auto size-8 mb-2" />
              <p>No team members found</p>
              <p className="text-sm mt-1">Add members to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.user?.name?.charAt(0)?.toUpperCase() ||
                          member.userId?.charAt(0)?.toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user?.name ||
                          `User ${member.userId?.slice(-4)}` ||
                          "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email || member.userId}
                      </p>
                    </div>
                  </div>
                  {member.userId !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removeResult.waiting}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
