"use client"

import * as React from "react"
import { Moon, Sun, Palette, CornerDownLeft, Shuffle } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu } from "./ui/dropdown-menu"
import { useTheme } from "./theme-provider"
import { useThemeSystem } from "./theme-system-provider"
import { themes } from "../lib/themes"
import { RADII, randomizeThemeParams } from "../lib/randomize"

export function ThemeDropdown() {
  const { theme: colorMode, setTheme } = useTheme()
  const { themeName, setThemeName, radius, setRadius } =
    useThemeSystem()

  const handleRandomize = React.useCallback(() => {
    const randomized = randomizeThemeParams()
    setThemeName(randomized.theme || "neutral")
    setRadius(randomized.radius || "default")
  }, [setThemeName, setRadius])

  const currentRadius = RADII.find((r) => r.name === radius) || RADII[2] // default

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="w-56">
        {/* Color Mode Toggle */}
        <DropdownMenu.Label>Color Mode</DropdownMenu.Label>
        <DropdownMenu.Item onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {colorMode === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {colorMode === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme("system")}>
          <span className="mr-2 h-4 w-4 flex items-center justify-center">
            ⚙️
          </span>
          <span>System</span>
          {colorMode === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        {/* Theme Presets */}
        <DropdownMenu.Label>Theme</DropdownMenu.Label>
        {Object.entries(themes).map(([name, theme]) => {
          // Get the primary color from the theme for the indicator
          const primaryColor = theme.cssVars.light.primary || "oklch(0.205 0 0)"
          return (
            <DropdownMenu.Item
              key={name}
              onClick={() => setThemeName(name)}
              className="capitalize"
            >
              <div
                className="mr-2 h-4 w-4 rounded-full border border-border"
                style={{
                  backgroundColor: primaryColor,
                }}
              />
              <span>{name}</span>
              {themeName === name && <span className="ml-auto">✓</span>}
            </DropdownMenu.Item>
          )
        })}

        <DropdownMenu.Separator />

        {/* Radius Selector */}
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            <CornerDownLeft className="mr-2 h-4 w-4" />
            <span>Radius</span>
            <span className="ml-auto text-xs text-muted-foreground capitalize">
              {currentRadius.name}
            </span>
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {RADII.map((r) => (
              <DropdownMenu.Item
                key={r.name}
                onClick={() => setRadius(r.name)}
                className="capitalize"
              >
                <span>{r.name}</span>
                {radius === r.name && <span className="ml-auto">✓</span>}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* Randomize Button */}
        <DropdownMenu.Item onClick={handleRandomize}>
          <Shuffle className="mr-2 h-4 w-4" />
          <span>Randomize</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

