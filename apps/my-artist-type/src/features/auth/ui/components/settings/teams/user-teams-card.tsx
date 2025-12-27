import { Card, Button } from "@shadcn";
import { UsersIcon } from "lucide-react";
import { Result, useAtomValue, useAtom } from "@effect-atom/atom-react";
import { toast } from "sonner";
import {
  userTeamsAtom,
  setActiveTeamAtom,
} from "../../../../client/atoms/organization.atoms.js";
import { sessionAtom } from "../../../../client/atoms/session.atoms.js";

export interface UserTeamsCardProps {
  className?: string;
}

export function UserTeamsCard({ className }: UserTeamsCardProps) {
  const teamsResult = useAtomValue(userTeamsAtom);
  const [setActiveResult, setActiveTeam] = useAtom(setActiveTeamAtom);

  const isPending = Result.isInitial(teamsResult) && teamsResult.waiting;
  const teams = Result.builder(teamsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  const handleSetActiveTeam = async (teamId: string) => {
    try {
      await setActiveTeam({ teamId });
      toast.success("Active team updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update active team");
      }
    }
  };

  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ""}`}>
      <TeamMembershipCard
        teams={teams}
        loading={isPending}
        updatingTeamId={setActiveResult.waiting ? "updating" : null}
        onSetActiveTeam={handleSetActiveTeam}
      />
    </div>
  );
}

// Team Membership Card
function TeamMembershipCard({
  teams,
  loading,
  updatingTeamId,
  onSetActiveTeam,
}: {
  teams: any[];
  loading: boolean;
  updatingTeamId: string | null;
  onSetActiveTeam: (teamId: string) => void;
}) {
  // Get current active team from session
  const sessionResult = useAtomValue(sessionAtom);
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;
  const activeTeamId = session?.session?.activeTeamId;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <UsersIcon className="size-5" />
          Your Teams
        </Card.Title>
        <Card.Description>
          Teams you're a member of across all organizations. Set your active
          team to switch contexts.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="space-y-3">
            {/* Skeleton loading state */}
            {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
              <div
                key={key}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="w-8 h-8 bg-muted rounded-md animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UsersIcon className="mx-auto size-8 mb-2" />
            <p>You are not a member of any teams.</p>
            <p className="text-sm mt-1">
              Join a team to collaborate with others.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTeamId === team.id ? "Active team" : "Team member"}
                    </p>
                  </div>
                </div>
                {activeTeamId !== team.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetActiveTeam(team.id)}
                    disabled={updatingTeamId !== null}
                  >
                    {updatingTeamId !== null ? "Setting..." : "Set Active"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
