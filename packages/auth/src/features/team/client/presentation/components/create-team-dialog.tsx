import { useState } from 'react';
import { Dialog, Button, Input } from '@shadcn';
import { useForm } from '@tanstack/react-form';
import { useAtom, useAtomValue, Result } from '@effect-atom/atom-react';
import { toast } from 'sonner';
import { createTeamAtom } from '@auth/features/team/client/atoms.js';
import { sessionAtom } from '@auth/features/session/client/atoms';

export interface CreateTeamDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateTeamDialog({ children, onSuccess }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [_createResult, createTeam] = useAtom(createTeamAtom);
  const sessionResult = useAtomValue(sessionAtom);

  const activeOrgId = Result.builder(sessionResult)
    .onSuccess((s) => s?.session?.activeOrganizationId)
    .orNull();

  const form = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: ({ value }) => {
      if (!activeOrgId) {
        toast.error('No active organization');
        return;
      }

      try {
        createTeam({
          organizationId: activeOrgId,
          name: value.name,
        });
        setOpen(false);
        form.reset();
        toast.success('Team created successfully');
        onSuccess?.();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to create team');
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create Team</Dialog.Title>
        </Dialog.Header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Team Name
                </label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  placeholder="Enter team name"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
