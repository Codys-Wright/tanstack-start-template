import { useEffect } from "react";
import { useState } from "react";
import { Button, Input, Card } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { useAtom, Result } from "@effect-atom/atom-react";
import { signUpAtom } from "./auth.atoms";
import type { SignUpInput } from "../domain";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [signUpResult, signUp] = useAtom(signUpAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) return;

    const input: SignUpInput = {
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: "/",
    };

    signUp(input);
  };

  // Handle success/error states
  useEffect(() => {
    if (Result.isSuccess(signUpResult)) {
      // Redirect will happen via callbackURL
      window.location.href = "/";
    }
  }, [signUpResult]);

  const hasError = Result.isFailure(signUpResult);
  const passwordsMatch = password === confirmPassword;
  const isFormValid = name.trim() && email.trim() && password.trim() && passwordsMatch;

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Sign Up</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              disabled={signUpResult.waiting}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={signUpResult.waiting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={signUpResult.waiting}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={signUpResult.waiting}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {hasError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Failed to sign up. Please try again.
            </div>
          )}

          <Button type="submit" disabled={signUpResult.waiting || !isFormValid} className="w-full">
            {signUpResult.waiting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card.Content>
    </Card>
  );
}