# Shadcn UI Feature

This feature contains all shadcn/ui components and related UI utilities.

## Structure

```
shadcn/
├── components/
│   ├── ui/              # shadcn/ui components (button, dropdown-menu, etc.)
│   ├── theme-provider.tsx  # Theme provider for dark/light mode
│   └── mode-toggle.tsx     # Theme toggle component
├── lib/
│   └── utils.ts         # Utility functions (cn helper)
└── hooks/               # Custom hooks
```

## Usage

### Import Components

```typescript
// Import from main index
import { Button, ModeToggle, ThemeProvider, cn } from "@shadcn"

// Or import specific components
import { Button } from "@shadcn/components/ui/button"
import { ThemeProvider, useTheme } from "@shadcn/components/theme-provider"
```

### Theme Provider Setup

Wrap your app root with `ThemeProvider`:

```tsx
import { ThemeProvider } from "@shadcn"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  )
}
```

### Using Mode Toggle

```tsx
import { ModeToggle } from "@shadcn"

function Header() {
  return (
    <header>
      <ModeToggle />
    </header>
  )
}
```

## Vite Configuration Requirements

This feature requires specific Vite configuration to work properly. If you need to modify vite config, ensure these settings are maintained:

### Required Vite Config

The following configuration in `vite.config.ts` is required for this feature:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    // ... other plugins
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    // ... rest of plugins
  ],
})
```

### Key Requirements

1. **`vite-tsconfig-paths` plugin**: Required for TypeScript path aliases (`@shadcn`, `@/features/*`, etc.) to work in Vite
2. **`@tailwindcss/vite` plugin**: Required for Tailwind CSS processing
3. **TypeScript path aliases**: Must be configured in `tsconfig.json` (see below)

### TypeScript Configuration

Ensure `tsconfig.json` includes these path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shadcn": ["./src/features/ui/shadcn"],
      "@shadcn/*": ["./src/features/ui/shadcn/*"]
    }
  }
}
```

### Tailwind CSS Configuration

The feature uses Tailwind CSS with CSS variables for theming. Ensure your `src/styles.css` includes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode variables */
  }
  
  .dark {
    /* Dark mode variables */
  }
}
```

## Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Components will be automatically installed to `components/ui/` based on the `components.json` configuration.

## Dependencies

This feature depends on:
- `@radix-ui/*` - UI primitives
- `class-variance-authority` - Variant management
- `clsx` & `tailwind-merge` - Class name utilities
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Notes

- All components use the `@shadcn` alias for imports
- Theme state is persisted in localStorage (default key: `vite-ui-theme`)
- Theme provider supports "light", "dark", and "system" modes
- System mode automatically detects user's OS preference

