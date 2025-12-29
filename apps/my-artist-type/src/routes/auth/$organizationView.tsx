import { Card } from "@shadcn";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/$organizationView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationView } = Route.useParams();

  return (
    <main className="container mx-auto p-4 md:p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <Card.Header>
          <Card.Title>Organization: {organizationView}</Card.Title>
          <Card.Description>
            This is a placeholder for the {organizationView} organization page
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-muted-foreground">
            Organization management components will be added here incrementally.
          </p>
        </Card.Content>
      </Card>
    </main>
  );
}
