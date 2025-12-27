import { Card } from "@shadcn";
import { UsersIcon, PlusIcon } from "lucide-react";
import { Button } from "@shadcn";
import { useMemo } from "react";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { CreateTeamDialog } from "./create-team-dialog.js";
import { TeamCell } from "./team-cell.js";
import { teamsAtom } from "../../organization/organization.atoms.js";
import { sessionAtom } from "../../session/session.atoms.js";
import { useTeamPermissions } from "../use-team-permissions.js";

export interface TeamsCardProps {
  className?: string;
}

export function TeamsCard({ className }: TeamsCardProps) {
  const sessionResult = useAtomValue(sessionAtom);

  // Derive activeOrgId reactively from session
  const activeOrgId = Result.builder(sessionResult)
    .onSuccess((s) => s?.session?.activeOrganizationId)
    .orNull();

  // Create teams atom for current org (memoized to prevent recreating)
  const currentTeamsAtom = useMemo(
    () => (activeOrgId ? teamsAtom(activeOrgId) : teamsAtom(undefined)),
    [activeOrgId]
  );

  const teamsResult = useAtomValue(currentTeamsAtom);
  const permissions = useTeamPermissions();

  const isPending = Result.isInitial(teamsResult) && teamsResult.waiting;
  const teams = Result.builder(teamsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ""}`}>
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title className="flex items-center gap-2">
                <UsersIcon className="size-5" />
                Teams
              </Card.Title>
              <Card.Description>
                Manage teams within your organization.
              </Card.Description>
            </div>
            <CreateTeamDialog>
              <Button
                size="sm"
                className="gap-2"
                disabled={!permissions.canCreate || !activeOrgId}
              >
                <PlusIcon className="size-4" />
                Create Team
              </Button>
            </CreateTeamDialog>
          </div>
        </Card.Header>
        <Card.Content>
          {!activeOrgId ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="mx-auto size-8 mb-2" />
              <p>No active organization</p>
              <p className="text-sm mt-1">
                Switch to an organization above to manage teams.
              </p>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              {/* Skeleton loading state */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
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
              <p>No teams found</p>
              <p className="text-sm mt-1">
                Create your first team to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team: any) => (
                <TeamCell
                  key={team.id}
                  team={team}
                  canUpdate={permissions.canUpdate}
                  canDelete={permissions.canDelete}
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
