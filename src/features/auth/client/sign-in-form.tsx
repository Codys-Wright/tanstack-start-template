import { useEffect } from "react";
import { useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { useAtom, Result } from "@effect-atom/atom-react";
import { signInAtom } from "./auth.atoms";
import type { SignInInput } from "../domain";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signInResult, signIn] = useAtom(signInAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const input: SignInInput = {
      email: email.trim(),
      password,
      callbackURL: "/",
    };

    signIn(input);
  };

  // Handle success/error states
  useEffect(() => {
    if (Result.isSuccess(signInResult)) {
      // Redirect will happen via callbackURL
      window.location.href = "/";
    }
  }, [signInResult]);

  const hasError = Result.isFailure(signInResult);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={signInResult.waiting}
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
              disabled={signInResult.waiting}
            />
          </div>

          {hasError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Failed to sign in. Please try again.
            </div>
          )}

          <Button type="submit" disabled={signInResult.waiting || !email.trim() || !password.trim()} className="w-full">
            {signInResult.waiting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}