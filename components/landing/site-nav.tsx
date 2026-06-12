"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "#pipeline", label: "Pipeline" },
  { href: "#gate", label: "The gate" },
  { href: "#create", label: "Draft & route" },
  { href: "#loop", label: "The loop" },
]

export function SiteNav() {
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full border border-transparent px-4 py-2.5 transition-all duration-500",
          scrolled && "glass-bar"
        )}
      >
        <a href="#top" className="group flex items-center gap-2">
          <img src="/icon.svg" alt="bideez" className="size-7" />
          <span className="font-display text-lg font-semibold tracking-tight">
            bideez
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-medium sm:inline-flex"
            asChild
          >
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button size="sm" className="font-medium" asChild>
            <Link href="/auth?mode=signup">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
