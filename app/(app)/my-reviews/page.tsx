import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getReviewTasks } from "@/lib/api/me"
import type { MyReviewTask } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

  const pending = tasks.filter((t) => t.myStatus === "pending")
  const done = tasks.filter((t) => t.myStatus === "done")

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-tight">My Reviews</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Proposal sections you&apos;ve been asked to review across all workspaces.
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No review assignments yet.
        </p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <TaskGroup title="Pending" tasks={pending} />
          )}
          {done.length > 0 && (
            <TaskGroup title="Done" tasks={done} />
          )}
        </div>
      )}
    </div>
  )
}

function TaskGroup({ title, tasks }: { title: string; tasks: MyReviewTask[] }) {
  return (
    <div>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {title} ({tasks.length})
      </h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Link
            key={task.sectionId}
            href={`/workspaces/${task.workspaceId}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{task.sectionTitle}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {task.workspaceTitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {task.isPlaceholder && (
                <Badge className="bg-scored/15 text-scored text-[10px]">Needs input</Badge>
              )}
              <Badge
                className={cn(
                  "text-[10px]",
                  task.myStatus === "done" ? "bg-go/15 text-go" : "bg-muted text-muted-foreground"
                )}
              >
                {task.myStatus === "done" ? (
                  <CheckCircle2 className="mr-0.5 size-2.5" />
                ) : (
                  <Clock className="mr-0.5 size-2.5" />
                )}
                {task.myStatus}
              </Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
