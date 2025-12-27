/**
 * Generate CSS for theme variables (used in both SSR and client)
 */
import { getTheme } from "./themes.js";

export function generateThemeCSS(
  themeName: string,
  colorMode: "light" | "dark",
  radius: string
): string {
  const theme = getTheme(themeName);

  const { light: lightVars, dark: darkVars } = theme.cssVars;

  const radiusMap: Record<string, string> = {
    none: "0",
    sm: "0.125rem",
    default: "0.625rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
  };
  const radiusValue = radiusMap[radius] || radiusMap.default;

  let cssText = ":root {\n";
  cssText += `  --radius: ${radiusValue};\n`;
  Object.entries(lightVars).forEach(([key, value]) => {
    if (value) {
      cssText += `  --${key}: ${value};\n`;
    }
  });
  cssText += "}\n\n";

  cssText += ".dark {\n";
  Object.entries(darkVars).forEach(([key, value]) => {
    if (value) {
      cssText += `  --${key}: ${value};\n`;
    }
  });
  cssText += "}\n";

  return cssText;
}
