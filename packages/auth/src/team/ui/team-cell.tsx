import { Card, Button, DropdownMenu } from "@shadcn";
import { UsersIcon, MoreVerticalIcon, UserPlusIcon } from "lucide-react";
import { UpdateTeamDialog } from "./update-team-dialog.js";
import { DeleteTeamDialog } from "./delete-team-dialog.js";
import { TeamMembersDialog } from "./team-members-dialog.js";
import type { Team } from "../team.schema.js";

export interface TeamCellProps {
  team: Team;
  canUpdate?: boolean;
  canDelete?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function TeamCell({
  team,
  canUpdate = true,
  canDelete = true,
  onUpdate,
  onDelete,
}: TeamCellProps) {
  return (
    <Card>
      <Card.Content className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{team.name}</h3>
            <p className="text-sm text-muted-foreground">Team</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item asChild>
              <TeamMembersDialog team={team}>
                <div className="flex items-center">
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  <span>Manage Members</span>
                </div>
              </TeamMembersDialog>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <UpdateTeamDialog team={team} onSuccess={onUpdate}>
              <DropdownMenu.Item
                onSelect={(e) => e.preventDefault()}
                disabled={!canUpdate}
              >
                Update Team
              </DropdownMenu.Item>
            </UpdateTeamDialog>
            <DeleteTeamDialog team={team} onSuccess={onDelete}>
              <DropdownMenu.Item
                onSelect={(e) => e.preventDefault()}
                disabled={!canDelete}
                className="text-destructive focus:text-destructive"
              >
                Delete Team
              </DropdownMenu.Item>
            </DeleteTeamDialog>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Card.Content>
    </Card>
  );
}
