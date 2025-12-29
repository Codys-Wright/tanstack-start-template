import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sidebar-test')({
  component: function SidebarTestPage() {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Sidebar Test Page</h1>
        <p className="text-lg text-gray-600 mb-6">
          This page tests of sidebar component to see if it's working correctly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Main dashboard content goes here.</p>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-muted-foreground">Analytics data and charts.</p>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-2">Projects</h2>
            <p className="text-muted-foreground">Project management tools.</p>
          </div>
        </div>

        <div className="mt-8 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Instructions</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Check if the sidebar layout works correctly</li>
            <li>• Test the content area responsiveness</li>
            <li>• Verify styling matches the design system</li>
          </ul>
        </div>
      </div>
    );
  },
});
