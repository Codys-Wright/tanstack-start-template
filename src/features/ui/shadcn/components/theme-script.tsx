/**
 * ThemeScript - Inline script that runs synchronously before React hydration
 * to inject CSS variables from localStorage, preventing FOUC (Flash of Unstyled Content)
 */
import { themes } from "../lib/themes.js"

export function getThemeScriptContent({
  defaultThemeName = "neutral",
  defaultRadius = "default",
  storageKey = "vite-ui-theme-name",
  radiusStorageKey = "vite-ui-radius",
  themeStorageKey = "vite-ui-theme",
}: {
  defaultThemeName?: string
  defaultRadius?: string
  storageKey?: string
  radiusStorageKey?: string
  themeStorageKey?: string
}): string {
  // Serialize all theme data for the inline script
  const themesData = JSON.stringify(
    Object.fromEntries(
      Object.entries(themes).map(([name, theme]) => [
        name,
        {
          light: theme.cssVars.light,
          dark: theme.cssVars.dark,
        },
      ])
    )
  )

  return `
(function() {
  try {
    // Theme data embedded at build time
    const themes = ${themesData};
    
    // Get theme preferences from localStorage
    const themeName = localStorage.getItem('${storageKey}') || '${defaultThemeName}';
    const radius = localStorage.getItem('${radiusStorageKey}') || '${defaultRadius}';
    const colorMode = localStorage.getItem('${themeStorageKey}') || 'system';
    
    // Resolve system theme
    let actualColorMode = colorMode;
    if (colorMode === 'system') {
      actualColorMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Get theme CSS variables (fallback to neutral if theme not found)
    const theme = themes[themeName] || themes['${defaultThemeName}'];
    const lightVars = theme.light;
    const darkVars = theme.dark;
    
    // Generate CSS text
    let cssText = ':root {\\n';
    Object.entries(lightVars).forEach(([key, value]) => {
      if (value) {
        cssText += '  --' + key + ': ' + value + ';\\n';
      }
    });
    cssText += '}\\n\\n';
    
    cssText += '.dark {\\n';
    Object.entries(darkVars).forEach(([key, value]) => {
      if (value) {
        cssText += '  --' + key + ': ' + value + ';\\n';
      }
    });
    cssText += '}\\n';
    
    // Inject style element
    const styleId = 'theme-system-vars';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.insertBefore(styleElement, document.head.firstChild);
    }
    styleElement.textContent = cssText;
    
    // Set radius variable
    const radiusMap = {
      'none': '0',
      'sm': '0.125rem',
      'default': '0.625rem',
      'md': '0.75rem',
      'lg': '1rem',
      'xl': '1.5rem',
      '2xl': '2rem'
    };
    const radiusValue = radiusMap[radius] || radiusMap['default'];
    document.documentElement.style.setProperty('--radius', radiusValue);
    
    // Apply color mode class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualColorMode);
  } catch (e) {
    // Fallback: apply default theme
    document.documentElement.classList.add('light');
  }
})();
`.trim()
}

export function ThemeScript({
  defaultThemeName = "neutral",
  defaultRadius = "default",
  storageKey = "vite-ui-theme-name",
  radiusStorageKey = "vite-ui-radius",
  themeStorageKey = "vite-ui-theme",
}: {
  defaultThemeName?: string
  defaultRadius?: string
  storageKey?: string
  radiusStorageKey?: string
  themeStorageKey?: string
}) {
  const scriptContent = getThemeScriptContent({
    defaultThemeName,
    defaultRadius,
    storageKey,
    radiusStorageKey,
    themeStorageKey,
  })

  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  )
}
