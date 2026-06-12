"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAccessToken } from "@/lib/api/browser"
import { approveCandidate, listCandidates, rejectCandidate } from "@/lib/api/candidates"
import type { RfpCandidate, RfpCandidateStatus } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TABS: { label: string; value: RfpCandidateStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

const SOURCE_LABELS: Record<string, string> = {
  gmail: "Gmail",
  manual: "Manual",
  research_agent: "Research",
}

function fitColor(score: number): string {
  if (score >= 70) return "text-go bg-go/10"
  if (score >= 40) return "text-scored bg-scored/10"
  return "text-gap bg-gap/10"
}

function formatDeadline(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ReviewQueue() {
  const router = useRouter()
  const [tab, setTab] = React.useState<RfpCandidateStatus>("pending")
  const [candidates, setCandidates] = React.useState<RfpCandidate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [acting, setActing] = React.useState<Record<string, "approving" | "rejecting">>({})

  // Manual refresh trigger: incrementing this causes the effect to re-run.
  const [refreshTick, setRefreshTick] = React.useState(0)

  // Load on tab change or manual refresh
  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve() // defer setState out of synchronous effect body
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessToken()
        const result = await listCandidates(tab, token)
        if (!cancelled) setCandidates(result.candidates)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load candidates")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [tab, refreshTick])

  // Poll every 30s on pending tab only (silent — no spinner)
  React.useEffect(() => {
    if (tab !== "pending") return
    const id = setInterval(() => {
      let cancelled = false
      const run = async () => {
        const token = await getAccessToken()
        const result = await listCandidates("pending", token)
        if (!cancelled) setCandidates(result.candidates)
      }
      run().catch(() => {})
      return () => {
        cancelled = true
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [tab])

  async function handleApprove(id: string) {
    setActing((prev) => ({ ...prev, [id]: "approving" }))
    try {
      const token = await getAccessToken()
      const { workspaceId } = await approveCandidate(id, token)
      router.push(`/workspaces/${workspaceId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("already") || msg.includes("409")) {
        setRefreshTick((n) => n + 1)
      }
      setActing((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  async function handleReject(id: string) {
    setActing((prev) => ({ ...prev, [id]: "rejecting" }))
    try {
      const token = await getAccessToken()
      await rejectCandidate(id, token)
      setCandidates((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setRefreshTick((n) => n + 1)
    } finally {
      setActing((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-muted/20 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setRefreshTick((n) => n + 1)}
          className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading candidates…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-gap/30 bg-gap/10 px-4 py-3 text-sm text-gap">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 p-10 text-center">
          <Mail className="mx-auto size-9 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === "pending"
              ? "No pending candidates. Forward an RFP email or connect Gmail to start receiving them."
              : `No ${tab} candidates.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              acting={acting[c.id]}
              onApprove={tab === "pending" ? () => handleApprove(c.id) : undefined}
              onReject={tab === "pending" ? () => handleReject(c.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CandidateCard({
  candidate: c,
  acting,
  onApprove,
  onReject,
}: {
  candidate: RfpCandidate
  acting?: "approving" | "rejecting"
  onApprove?: () => void
  onReject?: () => void
}) {
  const score = Number(c.domainFitScore)
  const busy = !!acting

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/30">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {SOURCE_LABELS[c.source] ?? c.source}
            </span>
            {c.status !== "pending" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  c.status === "approved" && "bg-go/10 text-go",
                  c.status === "rejected" && "bg-gap/10 text-gap",
                  c.status === "duplicate" && "bg-muted text-muted-foreground"
                )}
              >
                {c.status === "approved" && <CheckCircle2 className="size-3" />}
                {c.status === "rejected" && <XCircle className="size-3" />}
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            )}
          </div>
          <h3 className="font-semibold leading-snug">{c.title}</h3>
          {c.buyerName && (
            <p className="mt-0.5 text-sm text-muted-foreground">{c.buyerName}</p>
          )}
        </div>

        {/* Fit score */}
        <div
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-center min-w-[3.5rem]",
            fitColor(score)
          )}
        >
          <p className="text-lg font-bold leading-none">{score}</p>
          <p className="text-[10px] uppercase tracking-wide opacity-70">fit</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {c.deadline && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            Due {formatDeadline(c.deadline)}
          </span>
        )}
        {c.fromAddress && (
          <span className="flex items-center gap-1">
            <Mail className="size-3" />
            {c.fromAddress}
          </span>
        )}
        {c.attachmentFilename && (
          <span className="flex items-center gap-1">
            <Paperclip className="size-3" />
            {c.attachmentFilename}
          </span>
        )}
        <span className="flex items-center gap-1">
          <FileText className="size-3" />
          {timeAgo(c.createdAt)}
        </span>
      </div>

      {/* Overview */}
      {c.projectOverview && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {c.projectOverview}
        </p>
      )}

      {/* Classification reason */}
      {c.classificationReason && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
            Why flagged as RFP
          </summary>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed pl-2 border-l border-border">
            {c.classificationReason}
          </p>
        </details>
      )}

      {/* Actions */}
      {(onApprove || onReject) && (
        <div className="mt-4 flex items-center gap-2">
          {onApprove && (
            <Button size="sm" onClick={onApprove} disabled={busy} className="gap-1.5">
              {acting === "approving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Approve
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={busy}
              className="gap-1.5 text-gap hover:text-gap"
            >
              {acting === "rejecting" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
