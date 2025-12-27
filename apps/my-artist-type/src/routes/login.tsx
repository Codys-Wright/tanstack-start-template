import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect to new auth route structure
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth/$authView", params: { authView: "sign-in" } });
  },
});
