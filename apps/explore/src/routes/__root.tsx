import { RegistryProvider } from '@effect-atom/atom-react';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { getThemeScriptContent, ThemeProvider, ThemeSystemProviderWithContext } from '@theme';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SSE Demo - Explore',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const themeScript = getThemeScriptContent({
    defaultThemeName: 'neutral',
    defaultRadius: 'default',
    storageKey: 'vite-ui-theme-name',
    radiusStorageKey: 'vite-ui-radius',
    themeStorageKey: 'vite-ui-theme',
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ThemeSystemProviderWithContext>
            <RegistryProvider defaultIdleTTL={60_000}>{children}</RegistryProvider>
          </ThemeSystemProviderWithContext>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
