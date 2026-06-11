import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, LayoutGrid } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listWorkspaces } from "@/lib/api/workspaces"
import type { WorkspaceSummary } from "@/lib/api/types"
import { CreateWorkspace } from "@/components/workspaces/create-workspace"
import { StatusPill } from "@/components/workspaces/status-pill"

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let workspaces: WorkspaceSummary[] = []
  try {
    const res = await listWorkspaces(token)
    workspaces = res.workspaces
  } catch {
    // Backend unreachable / empty — render the empty state.
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <LayoutGrid className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Workspaces</h1>
      </div>

      <CreateWorkspace />

      <div className="mt-8 space-y-3">
        {workspaces.length === 0 ? (
          <p className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No workspaces yet. Create one above to start the bid-analysis pipeline.
          </p>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{ws.title}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ws.documentType}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusPill status={ws.status} />
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
