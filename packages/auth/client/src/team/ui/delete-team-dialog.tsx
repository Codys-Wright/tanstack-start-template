import { useState } from 'react';
import { Dialog, Button } from '@shadcn';
import { useAtom } from '@effect-atom/atom-react';
import { toast } from 'sonner';
import { removeTeamAtom } from '../../organization/organization.atoms.js';
import type { Team } from '@auth/domain';

export interface DeleteTeamDialogProps {
  team: Team;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteTeamDialog({ team, children, onSuccess }: DeleteTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteResult, deleteTeam] = useAtom(removeTeamAtom);

  const handleDelete = () => {
    try {
      deleteTeam({
        teamId: team.id,
        organizationId: team.organizationId,
      });
      setOpen(false);
      toast.success('Team deleted successfully');
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete team');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete Team</Dialog.Title>
        </Dialog.Header>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the team <strong>{team.name}</strong>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteResult.waiting}
            >
              {deleteResult.waiting ? 'Deleting...' : 'Delete Team'}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
