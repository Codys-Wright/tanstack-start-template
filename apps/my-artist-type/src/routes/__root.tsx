import { RegistryProvider } from '@effect-atom/atom-react';
import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from '@tanstack/react-router';
import { getThemeScriptContent, ThemeProvider, ThemeSystemProviderWithContext } from '@theme';
import { NavbarHome } from '../features/landing/navbar';
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
        title: 'My Artist Type',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // Preload Google Fonts
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
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Noto+Sans:wght@100..900&family=Nunito+Sans:opsz,wght@6..12,200..1000&family=Figtree:wght@300..900&family=Roboto:wght@100;300;400;500;700;900&family=Raleway:wght@100..900&family=DM+Sans:opsz,wght@9..40,100..1000&family=Public+Sans:wght@100..900&family=Outfit:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap',
      },
    ],
  }),

  // No loader needed - script handles initial theme injection
  // Atoms will load from localStorage on client

  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const location = useLocation();

  // Check if we're on an admin route (no navbar needed)
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Home page doesn't need top spacing (hero section handles it)
  const isHomePage = location.pathname === '/';

  return (
    <>
      {isAdminRoute ? (
        <Outlet />
      ) : (
        <NavbarHome>
          {/* Add top spacing for all pages except home (navbar is fixed) */}
          <div className={isHomePage ? '' : 'pt-24'}>
            <Outlet />
          </div>
        </NavbarHome>
      )}
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Generate blocking theme script - must be first to prevent FOUC
  const themeScript = getThemeScriptContent({
    defaultThemeName: 'neutral',
    defaultRadius: 'default',
    storageKey: 'vite-ui-theme-name',
    radiusStorageKey: 'vite-ui-radius',
    themeStorageKey: 'vite-ui-theme',
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking theme script - runs synchronously before any rendering */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <ThemeSystemProviderWithContext>
            <RegistryProvider defaultIdleTTL={60_000}>{children}</RegistryProvider>
            {/* <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            /> */}
          </ThemeSystemProviderWithContext>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
