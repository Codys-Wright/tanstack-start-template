import { Button, Card, Input, cn } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { forgotPasswordAtom } from "../session.atoms.js";

// Define the form schema using Effect Schema
const ForgotPasswordSchema = Schema.Struct({
  email: Schema.String,
});

export interface ForgotPasswordFormProps {
  className?: string;
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [forgotPasswordResult, forgotPassword] = useAtom(forgotPasswordAtom);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeSync(ForgotPasswordSchema)(value);

        forgotPassword({
          email: validated.email,
        });
      } catch {
        // Validation errors are handled by field validators
      }
    },
  });

  // Handle successful request
  useEffect(() => {
    if (Result.isSuccess(forgotPasswordResult)) {
      // Show success message and redirect
      window.location.href = "/auth/sign-in";
    }
  }, [forgotPasswordResult]);

  const isLoading =
    Result.isInitial(forgotPasswordResult) && forgotPasswordResult.waiting;
  const error = Result.builder(forgotPasswordResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <Card.Header>
        <Card.Title>Reset Password</Card.Title>
        <Card.Description>
          Enter your email to receive a password reset link
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
          {/* Email Field */}
          <form.Field
            name="email"
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
                  Email
                </label>
                <Input
                  id={field.name}
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  autoComplete="email"
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
                : "Failed to request password reset. Please try again."}
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Footer Links */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Remember your password?{" "}
            <Link
              to="/auth/$authView"
              params={{ authView: "sign-in" }}
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
