import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/features/auth/client";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignInForm />
    </div>
  );
}