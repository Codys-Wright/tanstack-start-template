import { Button, Card, Input, cn } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { recoverAccountAtom } from "./atoms/session.atoms.js";

// Define the form schema using Effect Schema
const RecoverAccountSchema = Schema.Struct({
  code: Schema.String,
});

export interface RecoverAccountFormProps {
  className?: string;
}

export function RecoverAccountForm({ className }: RecoverAccountFormProps) {
  const [recoverResult, recover] = useAtom(recoverAccountAtom);

  const form = useForm({
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeSync(RecoverAccountSchema)(value);

        recover({
          code: validated.code,
        });
      } catch {
        // Validation errors are handled by field validators
      }
    },
  });

  // Handle successful recovery
  useEffect(() => {
    if (Result.isSuccess(recoverResult)) {
      // Redirect to home or dashboard
      window.location.href = "/";
    }
  }, [recoverResult]);

  const isLoading = Result.isInitial(recoverResult) && recoverResult.waiting;
  const error = Result.builder(recoverResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <Card.Header>
        <Card.Title>Recover Account</Card.Title>
        <Card.Description>
          Enter one of your backup codes to regain access to your account
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
          {/* Backup Code Field */}
          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Backup code is required";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Backup Code
                </label>
                <Input
                  id={field.name}
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your backup code"
                  disabled={isLoading}
                  autoComplete="off"
                  required
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  You can find backup codes in your account security settings
                </p>
              </div>
            )}
          </form.Field>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to recover account. Please try again."}
            </div>
          )}

          {/* Submit Button */}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  "Recover Account"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Footer Links */}
        <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
          <p>
            <Link
              to="/auth/$authView"
              params={{ authView: "two-factor" }}
              className="text-primary hover:underline"
            >
              Back to 2FA
            </Link>
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
