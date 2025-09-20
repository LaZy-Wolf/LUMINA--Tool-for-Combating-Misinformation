"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LuminaLogo } from "@/components/lumina-logo"
import {
  Home,
  CheckCircle,
  ImageIcon,
  Video,
  Shield,
  Radar,
  Newspaper,
  FileText,
  Search,
  MessageSquare,
  Menu,
  X,
} from "lucide-react"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Fact-Check", href: "/fact-check", icon: CheckCircle },
  { name: "Image Authenticity", href: "/image", icon: ImageIcon },
  { name: "Video Authenticity", href: "/video", icon: Video },
  { name: "URL Safety", href: "/url-safety", icon: Shield },
  { name: "Bias Radar", href: "/bias-radar", icon: Radar },
  { name: "Neutral News", href: "/neutral-news", icon: Newspaper },
  { name: "Batch Fact-Check", href: "/batch", icon: FileText },
  { name: "Search", href: "/search", icon: Search },
  { name: "Social Media Context", href: "/social", icon: MessageSquare },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <LuminaLogo className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                LUMINA
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Truth Through Light</p>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
