import { cn } from "@shadcn";
import { createFileRoute } from "@tanstack/react-router";
import { AuthView } from "@/features/auth/ui/auth-view.js";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { authView } = Route.useParams();

  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthView pathname={authView} className="w-full max-w-sm" />
      <p
        className={cn(
          ["callback", "sign-out"].includes(authView) && "hidden",
          "text-muted-foreground text-xs"
        )}
      >
        Powered by{" "}
        <a
          className="text-primary underline"
          href="https://better-auth.com"
          target="_blank"
          rel="noreferrer"
        >
          better-auth
        </a>
      </p>
    </main>
  );
}
