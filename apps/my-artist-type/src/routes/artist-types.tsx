import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@shadcn';

/**
 * Artist Types route - catalog of all artist types and their characteristics
 * Educational page describing each artist archetype
 */
function ArtistTypesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Header className="text-center">
            <Card.Title className="text-2xl font-bold">Artist Types</Card.Title>
            <Card.Description className="text-lg">
              Discover the different types of artists and their characteristics
            </Card.Description>
          </Card.Header>
          <Card.Content className="text-center py-12">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-muted-foreground">Coming Soon</h2>
              <p className="text-muted-foreground">
                Learn about the various artist archetypes and what makes each unique.
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/artist-types')({
  component: ArtistTypesPage,
});
