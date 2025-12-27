import { cn } from "@shadcn";
import { createFileRoute } from "@tanstack/react-router";
// import { AuthView } from "@auth";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { authView } = Route.useParams();

  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      {/* <AuthView pathname={authView} className="w-full max-w-sm" /> */}
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Auth Page</h1>
        <p className="text-muted-foreground">Auth components are currently commented out.</p>
        <p className="text-sm mt-2">View: {authView}</p>
      </div>
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
