/**
 * Server-side theme utilities
 * Reads theme preferences from cookies for SSR
 */

export function getThemeFromCookies(
  cookieHeader: string | null | undefined,
  defaults: {
    themeName?: string
    fontName?: string
    radius?: string
    colorMode?: string
  } = {}
): {
  themeName: string
  fontName: string
  radius: string
  colorMode: string
} {
  const themeName = defaults.themeName || "neutral"
  const fontName = defaults.fontName || "inter"
  const radius = defaults.radius || "default"
  const colorMode = defaults.colorMode || "system"

  if (!cookieHeader) {
    return { themeName, fontName, radius, colorMode }
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {} as Record<string, string>)

  return {
    themeName: cookies["vite-ui-theme-name"] || themeName,
    fontName: cookies["vite-ui-font-name"] || fontName,
    radius: cookies["vite-ui-radius"] || radius,
    colorMode: cookies["vite-ui-theme"] || colorMode,
  }
}

export function getActualColorMode(colorMode: string): "light" | "dark" {
  if (colorMode === "system") {
    // On server, default to light (client script will handle system preference)
    return "light"
  }
  return colorMode === "dark" ? "dark" : "light"
}
