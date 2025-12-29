import { Button, cn, DropdownMenu, Skeleton } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { Link } from '@tanstack/react-router';
import { ChevronsUpDown, LogOutIcon, SettingsIcon } from 'lucide-react';
import { sessionAtom, signOutAtom } from '../../session/client/atoms.js';
import { UserAvatar } from './user-avatar';
import { UserView } from './user-view';

export interface UserButtonProps {
  size?: 'icon' | 'default';
  className?: string;
}

export function UserButton({ size = 'icon', className }: UserButtonProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const [signOutResult, signOut] = useAtom(signOutAtom);

  const isPending = Result.isInitial(sessionResult) && sessionResult.waiting;
  const user = Result.isSuccess(sessionResult) ? sessionResult.value?.user : null;
  const isSignedIn = Boolean(user);

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Skeleton className={cn('rounded-full', size === 'icon' ? 'size-10' : 'h-10 w-40')} />;
  }

  if (!isSignedIn) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link to="/auth/$authView" params={{ authView: 'sign-in' }}>
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        {size === 'icon' ? (
          <Button variant="ghost" size="icon" className={cn('rounded-full', className)}>
            <UserAvatar user={user} />
          </Button>
        ) : (
          <Button variant="ghost" className={cn('h-auto py-2 px-3', className)}>
            <UserView user={user} size="sm" />
            <ChevronsUpDown className="ml-2 size-4" />
          </Button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" className="w-56">
        <div className="px-2 py-1.5">
          <UserView user={user} size="sm" />
        </div>

        <DropdownMenu.Separator />

        <DropdownMenu.Item asChild>
          <Link
            to="/account/$accountView"
            params={{ accountView: 'settings' }}
            className="flex items-center gap-2"
          >
            <SettingsIcon className="size-4" />
            Account Settings
          </Link>
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item
          onClick={handleSignOut}
          disabled={signOutResult.waiting}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="size-4 mr-2" />
          {signOutResult.waiting ? 'Signing out...' : 'Sign Out'}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
