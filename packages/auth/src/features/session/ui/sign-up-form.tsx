import { Button, Card, Input, cn } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { Result, useAtom } from "@effect-atom/atom-react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import * as Schema from "effect/Schema";

import { signUpAtom } from "../session.atoms.js";
import type { SignUpInput } from "../../_core/auth.schema.js";

// Define the form schema using Effect Schema
const SignUpSchema = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  password: Schema.String,
  confirmPassword: Schema.String,
});

export interface SignUpFormProps {
  className?: string;
  redirectTo?: string;
}

export function SignUpForm({ className, redirectTo = "/" }: SignUpFormProps) {
  const [signUpResult, signUp] = useAtom(signUpAtom);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate passwords match
        if (value.password !== value.confirmPassword) {
          // Validation errors are handled by field validators
          return;
        }

        // Validate using Effect Schema
        const validated = Schema.decodeSync(SignUpSchema)(value);

        const input: SignUpInput = {
          email: validated.email,
          password: validated.password,
          name: validated.name,
          callbackURL: redirectTo,
        };

        signUp(input);
      } catch {
        // Validation errors are handled by field validators
        // This shouldn't be reached in normal flow
      }
    },
  });

  // Handle successful sign up
  useEffect(() => {
    if (Result.isSuccess(signUpResult)) {
      window.location.href = redirectTo;
    }
  }, [signUpResult, redirectTo]);

  const isLoading = Result.isInitial(signUpResult) && signUpResult.waiting;
  const error = Result.builder(signUpResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <Card.Header>
        <Card.Title>Create Account</Card.Title>
        <Card.Description>Sign up to get started</Card.Description>
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
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id={field.name}
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  placeholder="John Doe"
                  disabled={isLoading}
                  autoComplete="name"
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

          {/* Password Field */}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Password is required";
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
                  Password
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
                const password = form.getFieldValue("password");
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
                : "Failed to sign up. Please try again."}
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
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Footer Links */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
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
