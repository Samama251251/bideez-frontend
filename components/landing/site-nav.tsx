"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteNav() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        className={cn(
          "glass-pill relative flex items-center gap-8 rounded-full py-2 pr-2 pl-4 transition-shadow duration-500 sm:gap-12",
          scrolled ? "is-scrolled" : "shadow-none"
        )}
      >
        {/* logo */}
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-[0.5rem] bg-white font-display text-base font-bold text-black shadow-[0_2px_10px_-2px_rgba(255,255,255,0.35)]">
            b
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            bideez
          </span>
        </a>

        {/* account cluster */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
            asChild
          >
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-full font-medium"
            asChild
          >
            <Link href="/auth?mode=signup">
              <ShieldCheck className="size-4" />
              Get started
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
