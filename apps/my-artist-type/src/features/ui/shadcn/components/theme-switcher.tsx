"use client"

import { Palette } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu } from "./ui/dropdown-menu"
import { useThemeSystem } from "./theme-system-provider"
import { themes } from "../lib/themes"

export function ThemeSwitcher() {
  const { themeName, setThemeName } = useThemeSystem()

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch theme</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {Object.keys(themes).map((name) => (
          <DropdownMenu.Item
            key={name}
            onClick={() => setThemeName(name)}
            data-active={themeName === name}
            className="capitalize data-[active=true]:bg-accent"
          >
            {name}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

