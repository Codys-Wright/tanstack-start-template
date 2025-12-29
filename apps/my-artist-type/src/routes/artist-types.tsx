import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/artist-types')({
  component: function ArtistTypesPage() {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto border rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Artist Types</h1>
          <p className="text-muted-foreground mb-6">
            Discover different types of artists and their characteristics
          </p>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-muted-foreground">Coming Soon</h2>
          </div>
        </div>
      </div>
    );
  },
});
