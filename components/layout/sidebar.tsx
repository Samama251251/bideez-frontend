"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Library,
  BookOpen,
  Settings2,
  LogOut,
  ClipboardCheck,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/workspaces", icon: FileText, label: "Workspaces" },
  { href: "/review", icon: Inbox, label: "Opportunities" },
  { href: "/my-reviews", icon: ClipboardCheck, label: "My Reviews" },
  { href: "/library", icon: Library, label: "Company Library" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
]

interface SidebarProps {
  userName: string
  companyName: string | null
  userRole: string
}

export function Sidebar({ userName, companyName }: SidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const initials = userName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-sidebar-primary" />
          </span>
          <span className="font-display font-semibold tracking-tight text-sidebar-foreground">
            bideez
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="mb-1 px-3 pt-2 pb-1">
          <p className="font-mono text-[10px] tracking-widest text-sidebar-foreground/40 uppercase">
            Main
          </p>
        </div>

        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        <div className="my-2 h-px bg-sidebar-border" />

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings2 className="size-4 shrink-0" />
          Settings
        </Link>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-1.5 flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground leading-tight">
              {userName}
            </p>
            {companyName && (
              <p className="truncate text-xs text-sidebar-foreground/50 leading-tight">
                {companyName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex flex-1 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="flex items-center rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
