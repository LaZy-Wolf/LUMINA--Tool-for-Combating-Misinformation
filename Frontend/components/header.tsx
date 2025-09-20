"use client"

import { Button } from "@/components/ui/button"
import { LuminaLogo } from "@/components/lumina-logo"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="hidden md:flex items-center gap-3">
          <LuminaLogo className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              LUMINA
            </h2>
            <p className="text-xs text-muted-foreground -mt-1 font-medium tracking-wide">Truth Through Light</p>
          </div>
        </div>

        <div className="md:hidden">{/* Space for mobile menu button */}</div>

        <div className="flex items-center gap-4 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
