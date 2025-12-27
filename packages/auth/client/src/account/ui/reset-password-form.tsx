import { Button, Card, Input, cn } from "@shadcn";
import { Link, useSearch } from "@tanstack/react-router";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { resetPasswordAtom } from "../session.atoms.js";

// Define the form schema using Effect Schema
const ResetPasswordSchema = Schema.Struct({
  newPassword: Schema.String,
  confirmPassword: Schema.String,
});

export interface ResetPasswordFormProps {
  className?: string;
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const search = useSearch({ from: "/auth/$authView" }) as
    | Record<string, string>
    | undefined;
  const token = search?.token || "";

  const [resetPasswordResult, resetPassword] = useAtom(resetPasswordAtom);

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate passwords match
        if (value.newPassword !== value.confirmPassword) {
          // Validation errors are handled by field validators
          return;
        }

        // Validate using Effect Schema
        const validated = Schema.decodeSync(ResetPasswordSchema)(value);

        resetPassword({
          newPassword: validated.newPassword,
          token: token,
        });
      } catch {
        // Validation errors are handled by field validators
      }
    },
  });

  // Handle successful reset
  useEffect(() => {
    if (Result.isSuccess(resetPasswordResult)) {
      // Redirect to sign-in
      window.location.href = "/auth/sign-in";
    }
  }, [resetPasswordResult]);

  const isLoading =
    Result.isInitial(resetPasswordResult) && resetPasswordResult.waiting;
  const error = Result.builder(resetPasswordResult)
    .onFailure((failure) => failure)
    .orNull();

  // Check if token is invalid
  useEffect(() => {
    if (!token || token === "INVALID_TOKEN") {
      window.location.href = "/auth/sign-in?error=invalid_token";
    }
  }, [token]);

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <Card.Header>
        <Card.Title>Set New Password</Card.Title>
        <Card.Description>Enter your new password below</Card.Description>
      </Card.Header>

      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* New Password Field */}
          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "New password is required";
                if (value.length < 8) {
                  return "Password must be at least 8 characters";
                }
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
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
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
              </div>
            )}
          </form.Field>

          {/* Confirm Password Field */}
          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Confirm password is required";
                const password = form.getFieldValue("newPassword");
                if (value !== password) {
                  return "Passwords do not match";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id={field.name}
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
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
              </div>
            )}
          </form.Field>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to reset password. Please try again."}
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Footer Links */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            <Link
              to="/auth/$authView"
              params={{ authView: "sign-in" }}
              className="text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
