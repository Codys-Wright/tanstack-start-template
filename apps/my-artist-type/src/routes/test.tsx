import { createFileRoute } from "@tanstack/react-router";
import { ThemeDropdown } from "@theme";
import { Button } from "@shadcn";

export const Route = createFileRoute("/test")({
  component: TestPage,
});

function TestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Test Page</h1>
          <ThemeDropdown />
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Component Showcase</h2>
            <p className="text-muted-foreground mb-4">
              This page showcases various UI components to test theme
              persistence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Card 1</h3>
              <p className="text-sm text-muted-foreground">
                This is a test card to verify theme colors.
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Card 2</h3>
              <p className="text-sm text-muted-foreground">
                Navigate between pages to test persistence.
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Card 3</h3>
              <p className="text-sm text-muted-foreground">
                Theme should remain consistent across routes.
              </p>
            </div>
          </div>
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Muted Background</h3>
            <p className="text-sm text-muted-foreground">
              This section uses the muted background color to test theme
              variations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
