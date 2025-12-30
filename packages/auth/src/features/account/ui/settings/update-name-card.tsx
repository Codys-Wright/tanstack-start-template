import { Button, Card, Input } from '@shadcn';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { useForm } from '@tanstack/react-form';
import { Loader2Icon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

// TODO: Create updateProfileAtom in account atoms
// import { updateProfileAtom } from '../../client/atoms';

export interface UpdateNameCardProps {
  className?: string;
}

/**
 * Card component for updating the user's display name
 */
export function UpdateNameCard({ className }: UpdateNameCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const user = Result.isSuccess(sessionResult) ? sessionResult.value?.user : null;

  // TODO: Implement updateProfileAtom and use it here
  // const [updateResult, updateProfile] = useAtom(updateProfileAtom);
  // const isLoading = Result.isInitial(updateResult) && updateResult.waiting;
  const isLoading = false;

  const form = useForm({
    defaultValues: {
      name: user?.name || '',
    },
    onSubmit: async ({ value }) => {
      // TODO: Call updateProfile atom
      console.log('TODO: Update name to:', value.name);
    },
  });

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>Display Name</Card.Title>
        <Card.Description>This is the name that will be displayed on your profile</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Your name"
                disabled={isLoading}
              />
            )}
          </form.Field>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
