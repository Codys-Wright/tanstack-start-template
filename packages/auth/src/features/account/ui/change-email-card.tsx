import { Button, Card } from "@shadcn";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon, MailIcon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { changeEmailAtom } from "../../session/session.atoms.js";
import { SettingsCard } from "./settings-card.js";

export interface ChangeEmailCardProps {
  className?: string;
}

// Define the form schema using Effect Schema
const ChangeEmailSchema = Schema.Struct({
  newEmail: Schema.String,
});

export function ChangeEmailCard({ className }: ChangeEmailCardProps) {
  const [changeResult, changeEmail] = useAtom(changeEmailAtom);

  const form = useForm({
    defaultValues: {
      newEmail: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeSync(ChangeEmailSchema)(value);

        changeEmail({
          newEmail: validated.newEmail,
        });
      } catch {
        // Validation errors are handled by field validators
      }
    },
  });

  // Handle successful change request
  useEffect(() => {
    if (Result.isSuccess(changeResult)) {
      form.setFieldValue("newEmail", "");
    }
  }, [changeResult, form]);

  const isLoading = Result.isInitial(changeResult) && changeResult.waiting;
  const error = Result.builder(changeResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <SettingsCard className={className}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <MailIcon className="size-5" />
          Change Email
        </Card.Title>
        <Card.Description>
          Update your email address. You'll receive a verification link at your
          new email.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* New Email Field */}
          <form.Field
            name="newEmail"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Email is required";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  return "Invalid email format";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  New Email
                </label>
                <input
                  id={field.name}
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="newemail@example.com"
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
                : "Failed to change email. Please try again."}
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
                    Sending...
                  </>
                ) : (
                  "Change Email"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card.Content>
    </SettingsCard>
  );
}
