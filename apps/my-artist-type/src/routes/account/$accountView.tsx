import { createFileRoute } from "@tanstack/react-router";
// import { AccountView } from "@auth";

export const Route = createFileRoute("/account/$accountView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountView } = Route.useParams();

  return (
    <main className="container mx-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* <AccountView view={accountView as any} /> */}
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Account Page</h1>
          <p className="text-muted-foreground">Auth components are currently commented out.</p>
          <p className="text-sm mt-2">View: {accountView}</p>
        </div>
      </div>
    </main>
  );
}
