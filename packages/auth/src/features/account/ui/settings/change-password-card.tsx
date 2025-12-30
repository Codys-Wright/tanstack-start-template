import { Button, Card, Input, cn } from '@shadcn';
import { useForm } from '@tanstack/react-form';
import { Loader2Icon } from 'lucide-react';

// TODO: Create changePasswordAtom in account atoms
// import { changePasswordAtom } from '../../client/atoms';

export interface ChangePasswordCardProps {
  className?: string;
}

/**
 * Card component for changing the user's password
 */
export function ChangePasswordCard({ className }: ChangePasswordCardProps) {
  // TODO: Implement changePasswordAtom and use it here
  // const [changeResult, changePassword] = useAtom(changePasswordAtom);
  // const isLoading = Result.isInitial(changeResult) && changeResult.waiting;
  const isLoading = false;

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      // TODO: Call changePassword atom
      console.log('TODO: Change password');
    },
  });

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>Change Password</Card.Title>
        <Card.Description>Update your password to keep your account secure</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="currentPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Current password is required';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'New password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Please confirm your password';
                const newPassword = form.getFieldValue('newPassword');
                if (value !== newPassword) return 'Passwords do not match';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
