import { Button, Card } from '@shadcn';
import { Result, useAtom } from '@effect-atom/atom-react';
import { useForm } from '@tanstack/react-form';
import { ImageIcon, Loader2Icon, UploadIcon } from 'lucide-react';
import { useEffect } from 'react';
import * as Schema from 'effect/Schema';

import { updateImageAtom } from '../../session/session.atoms.js';
import { SettingsCard } from './settings-card.js';

export interface UpdateAvatarCardProps {
  className?: string;
}

// Define the form schema using Effect Schema
const UpdateAvatarSchema = Schema.Struct({
  image: Schema.String.pipe(
    Schema.minLength(1),
    Schema.filter(
      (s) => {
        try {
          new URL(s);
          return true;
        } catch {
          return false;
        }
      },
      { message: () => 'Invalid URL' },
    ),
  ),
});

export function UpdateAvatarCard({ className }: UpdateAvatarCardProps) {
  const [updateResult, updateImage] = useAtom(updateImageAtom);

  const form = useForm({
    defaultValues: {
      image: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeUnknownSync(UpdateAvatarSchema)(value);

        updateImage({
          image: validated.image,
        });
      } catch {
        // Validation errors are handled by field validators
      }
    },
  });

  // Handle successful update
  useEffect(() => {
    if (Result.isSuccess(updateResult)) {
      form.reset();
    }
  }, [updateResult, form]);

  const isLoading = Result.isInitial(updateResult) && updateResult.waiting;
  const error = Result.builder(updateResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <SettingsCard className={className}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          Update Avatar
        </Card.Title>
        <Card.Description>Update your profile picture</Card.Description>
      </Card.Header>

      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Image URL Field */}
          <form.Field
            name="image"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Image URL is required';
                try {
                  new URL(value);
                } catch {
                  return 'Invalid URL format';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    id={field.name}
                    type="url"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    onBlur={field.handleBlur}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={isLoading}
                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isLoading || !field.state.value}
                    onClick={() => {
                      window.open(field.state.value, '_blank');
                    }}
                  >
                    <UploadIcon className="size-4" />
                  </Button>
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : 'Failed to update avatar. Please try again.'}
            </div>
          )}

          {/* Submit Button */}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Avatar'
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card.Content>
    </SettingsCard>
  );
}
