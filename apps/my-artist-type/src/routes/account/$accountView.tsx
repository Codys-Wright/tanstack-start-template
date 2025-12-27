import { createFileRoute } from "@tanstack/react-router";
import { AccountView } from "@auth";

export const Route = createFileRoute("/account/$accountView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountView } = Route.useParams();

  return (
    <main className="container mx-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <AccountView view={accountView as any} />
      </div>
    </main>
  );
}
