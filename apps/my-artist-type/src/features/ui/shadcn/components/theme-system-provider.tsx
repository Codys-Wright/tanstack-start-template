"use client"

import * as React from "react"
import { getTheme, type ThemeDefinition } from "../lib/themes.js"
import { useTheme } from "./theme-provider.js"
import { useAtomValue, useAtomSet } from "@effect-atom/atom-react"
import { themeNameAtom, radiusAtom } from "../atoms/theme-atoms.js"

type ThemeSystemProviderProps = {
  children: React.ReactNode
  themeName?: string
  radius?: string
}

/**
 * ThemeSystemProvider dynamically injects CSS variables for theme switching at runtime.
 * Works alongside ThemeProvider to handle both light/dark mode and color theme switching.
 * Also handles radius switching.
 */
export function ThemeSystemProvider({
  children,
  themeName = "neutral",
  radius,
}: ThemeSystemProviderProps) {
  const { theme: colorMode } = useTheme()
  const theme = React.useMemo(() => getTheme(themeName), [themeName])
  
  // Track if this is the first render to avoid overwriting script-injected theme
  const isFirstRender = React.useRef(true)
  
  // Track the last theme we applied to detect if atoms reset
  const lastAppliedTheme = React.useRef<string | null>(null)

  // Use useLayoutEffect for synchronous CSS var updates to prevent flash
  // Note: ThemeScript already injects initial CSS before React hydration,
  // so this just updates when theme changes
  React.useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    // Update theme CSS variables
    if (theme && theme.cssVars) {
      const styleId = "theme-system-vars"
      let styleElement = document.getElementById(
        styleId
      ) as HTMLStyleElement | null

      if (!styleElement) {
        styleElement = document.createElement("style")
        styleElement.id = styleId
        // Insert at the beginning to ensure our variables are available early
        document.head.insertBefore(styleElement, document.head.firstChild)
      }

      const { light: lightVars, dark: darkVars } = theme.cssVars
      
      // Get radius value
      const radiusMap: Record<string, string> = {
        none: "0",
        sm: "0.125rem",
        default: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      }
      const radiusValue = radius ? (radiusMap[radius] || radiusMap.default) : radiusMap.default

      // Generate the new CSS
      let cssText = ":root {\n"
      // Add radius variable first
      cssText += `  --radius: ${radiusValue};\n`
      // Always set light vars as default
      Object.entries(lightVars).forEach(([key, value]) => {
        if (value) {
          cssText += `  --${key}: ${value};\n`
        }
      })
      cssText += "}\n\n"

      cssText += ".dark {\n"
      // Set dark vars for dark mode
      Object.entries(darkVars).forEach(([key, value]) => {
        if (value) {
          cssText += `  --${key}: ${value};\n`
        }
      })
      cssText += "}\n"

      // Atoms now load synchronously from localStorage, so they should match the script
      // Just check if CSS already matches to avoid unnecessary updates
      const currentContent = styleElement.textContent || ""
      if (currentContent === cssText) {
        isFirstRender.current = false
        lastAppliedTheme.current = themeName
        return
      }
      
      // Track the theme we're applying
      lastAppliedTheme.current = themeName
      
      // Only update if the CSS has actually changed to avoid unnecessary DOM updates
      if (currentContent !== cssText) {
        styleElement.textContent = cssText
        // Force a reflow to ensure styles are applied
        void styleElement.offsetHeight
      }
      
      isFirstRender.current = false
    }

    // Update radius CSS variable
    if (radius) {
      const radiusMap: Record<string, string> = {
        none: "0",
        sm: "0.125rem",
        default: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      }
      const radiusValue = radiusMap[radius] || radiusMap.default
      document.documentElement.style.setProperty("--radius", radiusValue)
    }
  }, [theme, colorMode, radius])

  return <>{children}</>
}

/**
 * Hook to get and set theme system parameters
 */
type ThemeSystemContextType = {
  themeName: string
  setThemeName: (name: string) => void
  radius: string
  setRadius: (radius: string) => void
}

const ThemeSystemContext = React.createContext<ThemeSystemContextType>({
  themeName: "neutral",
  setThemeName: () => {},
  radius: "default",
  setRadius: () => {},
})

export function ThemeSystemProviderWithContext({
  children,
  defaultThemeName = "neutral",
  defaultRadius = "default",
}: {
  children: React.ReactNode
  defaultThemeName?: string
  defaultRadius?: string
}) {
  // Use Effect Atom for theme state with localStorage persistence
  const themeName = useAtomValue(themeNameAtom)
  const radius = useAtomValue(radiusAtom)
  
  const setThemeNameAtom = useAtomSet(themeNameAtom)
  const setRadiusAtom = useAtomSet(radiusAtom)

  const setThemeName = React.useCallback(
    (name: string) => {
      setThemeNameAtom(name)
    },
    [setThemeNameAtom]
  )

  const setRadius = React.useCallback(
    (radiusValue: string) => {
      setRadiusAtom(radiusValue)
    },
    [setRadiusAtom]
  )

  return (
    <ThemeSystemContext.Provider
      value={{ themeName, setThemeName, radius, setRadius }}
    >
      <ThemeSystemProvider
        themeName={themeName}
        radius={radius}
      >
        {children}
      </ThemeSystemProvider>
    </ThemeSystemContext.Provider>
  )
}

export function useThemeSystem() {
  const context = React.useContext(ThemeSystemContext)
  if (context === undefined) {
    throw new Error(
      "useThemeSystem must be used within a ThemeSystemProviderWithContext"
    )
  }
  return context
}

