// Theme definitions with CSS variables
export type ThemeVars = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

export type ThemeDefinition = {
  name: string;
  cssVars: ThemeVars;
};

// Default neutral theme (matches shadcn default - using OKLCH format)
export const defaultTheme: ThemeDefinition = {
  name: "neutral",
  cssVars: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0 0)",
      primary: "oklch(0.205 0 0)",
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      "secondary-foreground": "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.205 0 0)",
      destructive: "oklch(0.58 0.22 27)",
      "destructive-foreground": "oklch(0.985 0 0)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.708 0 0)",
      "chart-1": "oklch(0.646 0.222 41.116)",
      "chart-2": "oklch(0.6 0.118 184.704)",
      "chart-3": "oklch(0.398 0.07 227.392)",
      "chart-4": "oklch(0.828 0.189 84.429)",
      "chart-5": "oklch(0.769 0.188 70.08)",
      sidebar: "oklch(0.985 0 0)",
      "sidebar-foreground": "oklch(0.145 0 0)",
      "sidebar-primary": "oklch(0.205 0 0)",
      "sidebar-primary-foreground": "oklch(0.985 0 0)",
      "sidebar-accent": "oklch(0.97 0 0)",
      "sidebar-accent-foreground": "oklch(0.205 0 0)",
      "sidebar-border": "oklch(0.922 0 0)",
      "sidebar-ring": "oklch(0.708 0 0)",
      radius: "0.625rem",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      "popover-foreground": "oklch(0.985 0 0)",
      primary: "oklch(0.87 0.00 0)",
      "primary-foreground": "oklch(0.205 0 0)",
      secondary: "oklch(0.269 0 0)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      "muted-foreground": "oklch(0.708 0 0)",
      accent: "oklch(0.371 0 0)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      "destructive-foreground": "oklch(0.985 0 0)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0 0)",
      "chart-1": "oklch(0.488 0.243 264.376)",
      "chart-2": "oklch(0.696 0.17 162.48)",
      "chart-3": "oklch(0.769 0.188 70.08)",
      "chart-4": "oklch(0.627 0.265 303.9)",
      "chart-5": "oklch(0.645 0.246 16.439)",
      sidebar: "oklch(0.205 0 0)",
      "sidebar-foreground": "oklch(0.985 0 0)",
      "sidebar-primary": "oklch(0.488 0.243 264.376)",
      "sidebar-primary-foreground": "oklch(0.985 0 0)",
      "sidebar-accent": "oklch(0.269 0 0)",
      "sidebar-accent-foreground": "oklch(0.985 0 0)",
      "sidebar-border": "oklch(1 0 0 / 10%)",
      "sidebar-ring": "oklch(0.556 0 0)",
      radius: "0.625rem",
    },
  },
};

// Helper function to create a colored theme by merging neutral base with color overrides
function createColoredTheme(
  name: string,
  colorOverrides: {
    light: Partial<ThemeDefinition["cssVars"]["light"]>;
    dark: Partial<ThemeDefinition["cssVars"]["dark"]>;
  }
): ThemeDefinition {
  return {
    name,
    cssVars: {
      light: {
        ...defaultTheme.cssVars.light,
        ...colorOverrides.light,
      } as Record<string, string>,
      dark: {
        ...defaultTheme.cssVars.dark,
        ...colorOverrides.dark,
      } as Record<string, string>,
    },
  };
}

// Color themes - merge neutral base with colored primary values
const blueTheme = createColoredTheme("blue", {
  light: {
    primary: "oklch(0.488 0.243 264.376)",
    "primary-foreground": "oklch(0.97 0.014 254.604)",
    ring: "oklch(0.488 0.243 264.376)",
    "chart-1": "oklch(0.809 0.105 251.813)",
    "chart-2": "oklch(0.623 0.214 259.815)",
    "chart-3": "oklch(0.546 0.245 262.881)",
    "chart-4": "oklch(0.488 0.243 264.376)",
    "chart-5": "oklch(0.424 0.199 265.638)",
    "sidebar-primary": "oklch(0.546 0.245 262.881)",
    "sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
    "sidebar-ring": "oklch(0.488 0.243 264.376)",
  },
  dark: {
    primary: "oklch(0.42 0.18 266)",
    "primary-foreground": "oklch(0.97 0.014 254.604)",
    ring: "oklch(0.42 0.18 266)",
    "chart-1": "oklch(0.809 0.105 251.813)",
    "chart-2": "oklch(0.623 0.214 259.815)",
    "chart-3": "oklch(0.546 0.245 262.881)",
    "chart-4": "oklch(0.488 0.243 264.376)",
    "chart-5": "oklch(0.424 0.199 265.638)",
    "sidebar-primary": "oklch(0.623 0.214 259.815)",
    "sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
    "sidebar-ring": "oklch(0.42 0.18 266)",
  },
});

const greenTheme = createColoredTheme("green", {
  light: {
    primary: "oklch(0.648 0.2 131.684)",
    "primary-foreground": "oklch(0.986 0.031 120.757)",
    ring: "oklch(0.648 0.2 131.684)",
    "chart-1": "oklch(0.871 0.15 154.449)",
    "chart-2": "oklch(0.723 0.219 149.579)",
    "chart-3": "oklch(0.627 0.194 149.214)",
    "chart-4": "oklch(0.527 0.154 150.069)",
    "chart-5": "oklch(0.448 0.119 151.328)",
    "sidebar-primary": "oklch(0.648 0.2 131.684)",
    "sidebar-primary-foreground": "oklch(0.986 0.031 120.757)",
    "sidebar-ring": "oklch(0.648 0.2 131.684)",
  },
  dark: {
    primary: "oklch(0.648 0.2 131.684)",
    "primary-foreground": "oklch(0.986 0.031 120.757)",
    ring: "oklch(0.648 0.2 131.684)",
    "chart-1": "oklch(0.871 0.15 154.449)",
    "chart-2": "oklch(0.723 0.219 149.579)",
    "chart-3": "oklch(0.627 0.194 149.214)",
    "chart-4": "oklch(0.527 0.154 150.069)",
    "chart-5": "oklch(0.448 0.119 151.328)",
    "sidebar-primary": "oklch(0.768 0.233 130.85)",
    "sidebar-primary-foreground": "oklch(0.986 0.031 120.757)",
    "sidebar-ring": "oklch(0.648 0.2 131.684)",
  },
});

const roseTheme = createColoredTheme("rose", {
  light: {
    primary: "oklch(0.586 0.253 17.585)",
    "primary-foreground": "oklch(0.969 0.015 12.422)",
    ring: "oklch(0.586 0.253 17.585)",
    "chart-1": "oklch(0.81 0.117 11.638)",
    "chart-2": "oklch(0.645 0.246 16.439)",
    "chart-3": "oklch(0.586 0.253 17.585)",
    "chart-4": "oklch(0.514 0.222 16.935)",
    "chart-5": "oklch(0.455 0.188 13.697)",
    "sidebar-primary": "oklch(0.586 0.253 17.585)",
    "sidebar-primary-foreground": "oklch(0.969 0.015 12.422)",
    "sidebar-ring": "oklch(0.586 0.253 17.585)",
  },
  dark: {
    primary: "oklch(0.645 0.246 16.439)",
    "primary-foreground": "oklch(0.969 0.015 12.422)",
    ring: "oklch(0.645 0.246 16.439)",
    "chart-1": "oklch(0.81 0.117 11.638)",
    "chart-2": "oklch(0.645 0.246 16.439)",
    "chart-3": "oklch(0.586 0.253 17.585)",
    "chart-4": "oklch(0.514 0.222 16.935)",
    "chart-5": "oklch(0.455 0.188 13.697)",
    "sidebar-primary": "oklch(0.645 0.246 16.439)",
    "sidebar-primary-foreground": "oklch(0.969 0.015 12.422)",
    "sidebar-ring": "oklch(0.645 0.246 16.439)",
  },
});

const purpleTheme = createColoredTheme("purple", {
  light: {
    primary: "oklch(0.56 0.25 302)",
    "primary-foreground": "oklch(0.98 0.01 308)",
    ring: "oklch(0.56 0.25 302)",
    "chart-1": "oklch(0.83 0.11 306)",
    "chart-2": "oklch(0.72 0.18 306)",
    "chart-3": "oklch(0.63 0.23 304)",
    "chart-4": "oklch(0.56 0.25 302)",
    "chart-5": "oklch(0.50 0.24 302)",
    "sidebar-primary": "oklch(0.56 0.25 302)",
    "sidebar-primary-foreground": "oklch(0.98 0.01 308)",
    "sidebar-ring": "oklch(0.56 0.25 302)",
  },
  dark: {
    primary: "oklch(0.63 0.23 304)",
    "primary-foreground": "oklch(0.98 0.01 308)",
    ring: "oklch(0.63 0.23 304)",
    "chart-1": "oklch(0.83 0.11 306)",
    "chart-2": "oklch(0.72 0.18 306)",
    "chart-3": "oklch(0.63 0.23 304)",
    "chart-4": "oklch(0.56 0.25 302)",
    "chart-5": "oklch(0.50 0.24 302)",
    "sidebar-primary": "oklch(0.72 0.18 306)",
    "sidebar-primary-foreground": "oklch(0.98 0.01 308)",
    "sidebar-ring": "oklch(0.63 0.23 304)",
  },
});

const orangeTheme = createColoredTheme("orange", {
  light: {
    primary: "oklch(0.646 0.222 41.116)",
    "primary-foreground": "oklch(0.98 0.016 73.684)",
    ring: "oklch(0.646 0.222 41.116)",
    "chart-1": "oklch(0.837 0.128 66.29)",
    "chart-2": "oklch(0.705 0.213 47.604)",
    "chart-3": "oklch(0.646 0.222 41.116)",
    "chart-4": "oklch(0.553 0.195 38.402)",
    "chart-5": "oklch(0.47 0.157 37.304)",
    "sidebar-primary": "oklch(0.646 0.222 41.116)",
    "sidebar-primary-foreground": "oklch(0.98 0.016 73.684)",
    "sidebar-ring": "oklch(0.646 0.222 41.116)",
  },
  dark: {
    primary: "oklch(0.705 0.213 47.604)",
    "primary-foreground": "oklch(0.98 0.016 73.684)",
    ring: "oklch(0.705 0.213 47.604)",
    "chart-1": "oklch(0.837 0.128 66.29)",
    "chart-2": "oklch(0.705 0.213 47.604)",
    "chart-3": "oklch(0.646 0.222 41.116)",
    "chart-4": "oklch(0.553 0.195 38.402)",
    "chart-5": "oklch(0.47 0.157 37.304)",
    "sidebar-primary": "oklch(0.705 0.213 47.604)",
    "sidebar-primary-foreground": "oklch(0.98 0.016 73.684)",
    "sidebar-ring": "oklch(0.705 0.213 47.604)",
  },
});

const cyanTheme = createColoredTheme("cyan", {
  light: {
    primary: "oklch(0.61 0.11 222)",
    "primary-foreground": "oklch(0.98 0.02 201)",
    ring: "oklch(0.61 0.11 222)",
    "chart-1": "oklch(0.87 0.12 207)",
    "chart-2": "oklch(0.80 0.13 212)",
    "chart-3": "oklch(0.71 0.13 215)",
    "chart-4": "oklch(0.61 0.11 222)",
    "chart-5": "oklch(0.52 0.09 223)",
    "sidebar-primary": "oklch(0.61 0.11 222)",
    "sidebar-primary-foreground": "oklch(0.98 0.02 201)",
    "sidebar-ring": "oklch(0.61 0.11 222)",
  },
  dark: {
    primary: "oklch(0.71 0.13 215)",
    "primary-foreground": "oklch(0.30 0.05 230)",
    ring: "oklch(0.71 0.13 215)",
    "chart-1": "oklch(0.87 0.12 207)",
    "chart-2": "oklch(0.80 0.13 212)",
    "chart-3": "oklch(0.71 0.13 215)",
    "chart-4": "oklch(0.61 0.11 222)",
    "chart-5": "oklch(0.52 0.09 223)",
    "sidebar-primary": "oklch(0.80 0.13 212)",
    "sidebar-primary-foreground": "oklch(0.30 0.05 230)",
    "sidebar-ring": "oklch(0.71 0.13 215)",
  },
});

// All available themes
export const themes: Record<string, ThemeDefinition> = {
  neutral: defaultTheme,
  blue: blueTheme,
  green: greenTheme,
  rose: roseTheme,
  purple: purpleTheme,
  orange: orangeTheme,
  cyan: cyanTheme,
};

export function getTheme(name: string): ThemeDefinition {
  return themes[name] || defaultTheme;
}
