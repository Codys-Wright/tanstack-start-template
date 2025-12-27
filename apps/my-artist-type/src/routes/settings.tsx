import { createFileRoute } from "@tanstack/react-router";
import { ThemeDropdown } from "@theme";
import { useThemeSystem } from "@theme";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { themeName, radius } = useThemeSystem();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <ThemeDropdown />
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold">
                  <span className="text-sm font-medium text-muted-foreground mr-2">
                    Current Theme
                  </span>
                  {themeName}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  <span className="text-sm font-medium text-muted-foreground mr-2">
                    Current Radius
                  </span>
                  {radius}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Theme Persistence Test
            </h2>
            <p className="text-muted-foreground mb-4">
              Change your theme settings and navigate to other pages. The theme
              should persist across all routes thanks to localStorage and the
              ThemeScript component.
            </p>
            <div className="flex gap-2">
              <div className="p-3 bg-primary/10 rounded border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">
                  Primary
                </div>
                <div className="h-8 bg-primary rounded"></div>
              </div>
              <div className="p-3 bg-secondary/10 rounded border border-secondary/20">
                <div className="text-xs text-muted-foreground mb-1">
                  Secondary
                </div>
                <div className="h-8 bg-secondary rounded"></div>
              </div>
              <div className="p-3 bg-accent/10 rounded border border-accent/20">
                <div className="text-xs text-muted-foreground mb-1">Accent</div>
                <div className="h-8 bg-accent rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
