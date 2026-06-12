import Link from "next/link"
import { ArrowRight, FileText, Inbox, Library, BookOpen, Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listWorkspaces } from "@/lib/api/workspaces"
import { listKnowledge } from "@/lib/api/knowledge"
import { StatusPill } from "@/components/workspaces/status-pill"
import type { WorkspaceSummary } from "@/lib/api/types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let workspaces: WorkspaceSummary[] = []
  let knowledgeCount = 0
  try {
    const [wsRes, knRes] = await Promise.all([
      listWorkspaces(token),
      listKnowledge(token),
    ])
    workspaces = wsRes.workspaces
    knowledgeCount = knRes.documents.length
  } catch {}

  const recentWorkspaces = workspaces.slice(0, 5)

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Overview of your bid pipeline activity
          </p>
        </div>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New workspace
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Workspaces"
          value={workspaces.length}
          icon={FileText}
          href="/workspaces"
        />
        <StatCard
          label="Knowledge Docs"
          value={knowledgeCount}
          icon={BookOpen}
          href="/knowledge"
        />
        <StatCard
          label="Opportunities"
          value={null}
          icon={Inbox}
          href="/review"
        />
      </div>

      {/* Recent workspaces */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground/70">Recent workspaces</h2>
          <Link
            href="/workspaces"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        {recentWorkspaces.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/10 p-8 text-center">
            <FileText className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No workspaces yet.</p>
            <Link
              href="/workspaces"
              className="mt-2 inline-flex items-center gap-1 text-sm text-primary transition-colors hover:underline"
            >
              Upload your first RFP <ArrowRight className="size-3" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            {recentWorkspaces.map((ws, i) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 ${
                  i < recentWorkspaces.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground/50" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ws.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {ws.documentType}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={ws.status} />
                  <ArrowRight className="size-3.5 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick nav */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground/70">Quick access</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/library",
              icon: Library,
              label: "Company Library",
              desc: "Capability docs and past bid history",
            },
            {
              href: "/knowledge",
              icon: BookOpen,
              label: "Knowledge Base",
              desc: "Policies, certifications and past proposals",
            },
            {
              href: "/review",
              icon: Inbox,
              label: "Opportunities",
              desc: "Email intake and web-discovered RFPs",
            },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: number | null
  icon: React.ComponentType<{ className?: string }>
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="font-display text-2xl font-semibold leading-none tabular-nums">
          {value === null ? "—" : value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}
