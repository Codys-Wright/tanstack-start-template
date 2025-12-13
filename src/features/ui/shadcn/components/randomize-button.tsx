"use client"

import * as React from "react"
import { Button } from "@shadcn"
import { useThemeSystem } from "./theme-system-provider.js"
import { randomizeThemeParams } from "../lib/randomize.js"

/**
 * Button component that randomizes all theme parameters (theme, radius)
 */
export function RandomizeButton() {
  const { setThemeName, setRadius } = useThemeSystem()

  const handleRandomize = React.useCallback(() => {
    const randomized = randomizeThemeParams()
    
    setThemeName(randomized.theme || "neutral")
    setRadius(randomized.radius || "default")
  }, [setThemeName, setRadius])

  return (
    <Button onClick={handleRandomize} variant="outline" size="sm">
      🎲 Randomize Theme
    </Button>
  )
}

