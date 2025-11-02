"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { features } from "@/lib/constants"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 animate-pulse"></div>
                <span className="text-white font-black text-lg relative z-10">L</span>
              </div>
              <span
                className="text-xl font-bold hidden sm:inline"
                style={{
                  background: "linear-gradient(to right, #2563eb, #9333ea)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                LUMINA
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="smooth-transition opacity-50" disabled>
                <Sun className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-3 flex-1">
            {/* Features Sidebar - Moved to LEFT with hamburger menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="smooth-transition">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-background border-r border-border">
                <SheetTitle className="sr-only">Features Menu</SheetTitle>
                <div className="space-y-6 mt-6">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50"></div>
                      <span className="text-white font-black text-sm relative z-10">L</span>
                    </div>
                    <span
                      className="text-lg font-bold"
                      style={{
                        background: "linear-gradient(to right, #2563eb, #9333ea)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      LUMINA
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 px-2">
                      Features
                    </h2>
                    <nav className="space-y-1">
                      {features.map((feature) => (
                        <Link
                          key={feature.id}
                          href={feature.path}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted smooth-transition group"
                        >
                          <feature.icon className="w-5 h-5 text-accent group-hover:text-primary smooth-transition flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">{feature.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                          </div>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="border-t border-border pt-4 px-2">
                    <p className="text-xs text-muted-foreground text-center">
                      LUMINA v1.0
                      <br />
                      Your AI-Powered Truth Guardian
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 animate-pulse"></div>
                <span className="text-white font-black text-sm relative z-10">L</span>
              </div>
              <span
                className="text-lg font-bold hidden sm:inline"
                style={{
                  background: "linear-gradient(to right, #2563eb, #9333ea)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                LUMINA
              </span>
            </Link>
          </div>

          {/* Theme Toggle - Right side */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="smooth-transition"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
