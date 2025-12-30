import { Button, Card } from '@shadcn';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { CameraIcon, Loader2Icon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms';
import { UserAvatar } from '@auth/features/user/client/presentation/components/user-avatar';

// TODO: Create updateAvatarAtom in account atoms
// import { updateAvatarAtom } from '../../client/atoms';

export interface UpdateAvatarCardProps {
  className?: string;
}

/**
 * Card component for updating the user's profile picture
 */
export function UpdateAvatarCard({ className }: UpdateAvatarCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const user = Result.isSuccess(sessionResult) ? sessionResult.value?.user : null;

  // TODO: Implement avatar upload functionality
  // const [updateResult, updateAvatar] = useAtom(updateAvatarAtom);
  // const isLoading = Result.isInitial(updateResult) && updateResult.waiting;
  const isLoading = false;

  const handleUpload = () => {
    // TODO: Implement file picker and upload
    console.log('TODO: Implement avatar upload');
  };

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>Profile Picture</Card.Title>
        <Card.Description>Upload a new profile picture</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar user={user} size="xl" />
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 size-8 rounded-full"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CameraIcon className="size-4" />
              )}
            </Button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Click the camera icon to upload a new profile picture. Recommended size: 256x256
              pixels.
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
