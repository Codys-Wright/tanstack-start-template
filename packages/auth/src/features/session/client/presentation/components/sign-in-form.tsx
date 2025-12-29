import { Button, Card, Input, cn } from '@shadcn';
import { Link } from '@tanstack/react-router';
import { Result, useAtom } from '@effect-atom/atom-react';
import { useForm } from '@tanstack/react-form';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import * as Schema from 'effect/Schema';

import { signInAtom } from '../../atoms.js';
import type { SignInInput } from '../../../domain/schema.js';

// Define the form schema using Effect Schema
const SignInSchema = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

export interface SignInFormProps {
  className?: string;
  redirectTo?: string;
}

export function SignInForm({ className, redirectTo = '/' }: SignInFormProps) {
  const [signInResult, signIn] = useAtom(signInAtom);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Effect Schema
        const validated = Schema.decodeSync(SignInSchema)(value);

        const input: SignInInput = {
          email: validated.email,
          password: validated.password,
          callbackURL: redirectTo,
        };

        signIn(input);
      } catch {
        // Validation errors are handled by field validators
        // This shouldn't be reached in normal flow
      }
    },
  });

  // Handle successful sign in
  useEffect(() => {
    if (Result.isSuccess(signInResult)) {
      window.location.href = redirectTo;
    }
  }, [signInResult, redirectTo]);

  const isLoading = Result.isInitial(signInResult) && signInResult.waiting;
  const error = Result.builder(signInResult)
    .onFailure((failure) => failure)
    .orNull();

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <Card.Header>
        <Card.Title>Sign In</Card.Title>
        <Card.Description>Enter your email and password to sign in</Card.Description>
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
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  return 'Invalid email format';
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
                  className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Password Field */}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Password is required';
                if (value.length < 8) {
                  return 'Password must be at least 8 characters';
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
                  autoComplete="current-password"
                  required
                  className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to sign in. Please try again.'}
            </div>
          )}

          {/* Submit Button */}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isLoading || isSubmitting} className="w-full">
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Footer Links */}
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Don't have an account?{' '}
            <Link
              to="/auth/$authView"
              params={{ authView: 'sign-up' }}
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p>
            <Link
              to="/auth/$authView"
              params={{ authView: 'forgot-password' }}
              className="text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
