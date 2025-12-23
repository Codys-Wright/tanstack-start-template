import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/features/auth/client";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignUpForm />
    </div>
  );
}