import { createFileRoute } from "@tanstack/react-router";
import { ThemeDropdown } from "@shadcn";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">About</h1>
          <ThemeDropdown />
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is the About page. Navigate between pages to test theme
            persistence.
          </p>
          <div className="p-4 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Theme Testing</h2>
            <p className="text-sm text-muted-foreground">
              Change the theme using the dropdown above and navigate between
              pages. The theme should persist across all routes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-primary text-primary-foreground rounded-lg">
              <h3 className="font-semibold mb-2">Primary Color</h3>
              <p className="text-sm opacity-90">
                This card uses the primary color scheme.
              </p>
            </div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
              <h3 className="font-semibold mb-2">Secondary Color</h3>
              <p className="text-sm opacity-90">
                This card uses the secondary color scheme.
              </p>
            </div>
            <div className="p-4 bg-accent text-accent-foreground rounded-lg">
              <h3 className="font-semibold mb-2">Accent Color</h3>
              <p className="text-sm opacity-90">
                This card uses the accent color scheme.
              </p>
            </div>
            <div className="p-4 bg-muted text-muted-foreground rounded-lg">
              <h3 className="font-semibold mb-2">Muted Color</h3>
              <p className="text-sm opacity-90">
                This card uses the muted color scheme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
