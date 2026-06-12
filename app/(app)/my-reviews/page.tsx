import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getReviewTasks } from "@/lib/api/me"
import type { MyReviewTask } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// One RFP (workspace) with its assigned sections folded into counts.
type ReviewRfp = {
  workspaceId: string
  workspaceTitle: string
  total: number
  pending: number
  done: number
  needsInput: boolean
}

// Collapse the per-section task list into one entry per RFP.
function groupByRfp(tasks: MyReviewTask[]): ReviewRfp[] {
  const byId = new Map<string, ReviewRfp>()
  for (const task of tasks) {
    let rfp = byId.get(task.workspaceId)
    if (!rfp) {
      rfp = {
        workspaceId: task.workspaceId,
        workspaceTitle: task.workspaceTitle,
        total: 0,
        pending: 0,
        done: 0,
        needsInput: false,
      }
      byId.set(task.workspaceId, rfp)
    }
    rfp.total += 1
    if (task.myStatus === "done") rfp.done += 1
    else rfp.pending += 1
    if (task.isPlaceholder && task.myStatus !== "done") rfp.needsInput = true
  }
  return [...byId.values()]
}

export default async function MyReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let tasks: MyReviewTask[] = []
  try {
    const res = await getReviewTasks(token)
    tasks = res.tasks
  } catch {
    // Backend unreachable / empty — render the empty state.
  }

  const rfps = groupByRfp(tasks)
  // An RFP is pending if any assigned section is still pending, otherwise done.
  const pending = rfps.filter((r) => r.pending > 0)
  const done = rfps.filter((r) => r.pending === 0)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-tight">My Reviews</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          RFPs with proposal sections you&apos;ve been asked to review.
        </p>
      </div>

      {rfps.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No review assignments yet.
        </p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && <RfpGroup title="Pending" rfps={pending} />}
          {done.length > 0 && <RfpGroup title="Done" rfps={done} />}
        </div>
      )}
    </div>
  )
}

function RfpGroup({ title, rfps }: { title: string; rfps: ReviewRfp[] }) {
  return (
    <div>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {title} ({rfps.length})
      </h2>
      <div className="space-y-2">
        {rfps.map((rfp) => {
          const isDone = rfp.pending === 0
          return (
            <Link
              key={rfp.workspaceId}
              href={`/workspaces/${rfp.workspaceId}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{rfp.workspaceTitle}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {isDone
                    ? `${rfp.total} section${rfp.total === 1 ? "" : "s"} reviewed`
                    : `${rfp.pending} to review${rfp.done > 0 ? ` · ${rfp.done} done` : ""}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {rfp.needsInput && (
                  <Badge className="bg-scored/15 text-scored text-[10px]">Needs input</Badge>
                )}
                <Badge
                  className={cn(
                    "text-[10px]",
                    isDone ? "bg-go/15 text-go" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="mr-0.5 size-2.5" />
                  ) : (
                    <Clock className="mr-0.5 size-2.5" />
                  )}
                  {isDone ? "done" : "pending"}
                </Badge>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
