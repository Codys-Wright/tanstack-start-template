import { Button, Card } from "@shadcn";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon, UserIcon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { updateNameAtom } from "../../session/session.atoms.js";
import { SettingsCard } from "./settings-card.js";

export interface UpdateNameCardProps {
  className?: string;
}

// Define the form schema using Effect Schema
const UpdateNameSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
});

export function UpdateNameCard({ className }: UpdateNameCardProps) {
  const [updateResult, updateName] = useAtom(updateNameAtom);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeUnknownSync(UpdateNameSchema)(value);

        updateName({
          name: validated.name,
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
          <UserIcon className="size-5" />
          Update Name
        </Card.Title>
        <Card.Description>Update your display name</Card.Description>
      </Card.Header>

      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Name is required";
                if (value.length > 100) {
                  return "Name must be less than 100 characters";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id={field.name}
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to update name. Please try again."}
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card.Content>
    </SettingsCard>
  );
}
