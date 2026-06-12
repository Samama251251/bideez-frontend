"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getAccessToken } from "@/lib/api/browser"
import {
  approveCandidate,
  listCandidates,
  rejectCandidate,
  runResearchAgent,
} from "@/lib/api/candidates"
import type { RfpCandidate, RfpCandidateStatus } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type SourceTab = "email" | "web"

const STATUS_TABS: { label: string; value: RfpCandidateStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

const EMAIL_SOURCES = new Set(["gmail", "manual"])
const WEB_SOURCES = new Set(["research_agent"])

const SOURCE_LABELS: Record<string, string> = {
  gmail: "Gmail",
  manual: "Manual",
  research_agent: "Web Search",
}

function fitColor(score: number): string {
  if (score >= 70) return "text-go bg-go/10"
  if (score >= 40) return "text-scored bg-scored/10"
  return "text-gap bg-gap/10"
}

function fitBarColor(score: number): string {
  if (score >= 70) return "bg-go"
  if (score >= 40) return "bg-scored"
  return "bg-gap"
}

function formatDeadline(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
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
  const [sourceTab, setSourceTab] = React.useState<SourceTab>("email")
  const [statusTab, setStatusTab] = React.useState<RfpCandidateStatus>("pending")
  const [candidates, setCandidates] = React.useState<RfpCandidate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [acting, setActing] = React.useState<Record<string, "approving" | "rejecting">>({})
  const [searching, setSearching] = React.useState(false)
  const [refreshTick, setRefreshTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessToken()
        const result = await listCandidates(statusTab, token)
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
  }, [statusTab, refreshTick])

  React.useEffect(() => {
    if (statusTab !== "pending") return
    const id = setInterval(() => {
      const run = async () => {
        const token = await getAccessToken()
        const result = await listCandidates("pending", token)
        setCandidates(result.candidates)
      }
      run().catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [statusTab])

  const filteredCandidates = candidates
    .filter((c) =>
      sourceTab === "email" ? EMAIL_SOURCES.has(c.source) : WEB_SOURCES.has(c.source)
    )
    .sort((a, b) => Number(b.domainFitScore) - Number(a.domainFitScore))

  async function handleFindRfps() {
    if (searching) return
    setSearching(true)
    const toastId = toast.loading("Searching the web for relevant RFPs…")
    try {
      const token = await getAccessToken()
      const result = await runResearchAgent(token)
      toast.dismiss(toastId)
      if (result.candidatesCreated > 0) {
        toast.success(
          `Found ${result.candidatesCreated} new ${result.candidatesCreated === 1 ? "opportunity" : "opportunities"}`
        )
        if (statusTab === "pending") {
          setRefreshTick((n) => n + 1)
        } else {
          setStatusTab("pending")
        }
      } else if (result.duplicatesSkipped > 0) {
        toast.info("No new RFPs found — all results already in your queue.")
      } else {
        toast.info(
          "No matching RFPs found. Try updating your capabilities or company description."
        )
      }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Research agent run failed")
    } finally {
      setSearching(false)
    }
  }

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
      {/* Source tabs (top-level) */}
      <div className="mb-5 border-b border-border">
        <div className="flex">
          {(
            [
              { value: "email" as SourceTab, label: "Email Intake", icon: Mail },
              { value: "web" as SourceTab, label: "Web Discovery", icon: Globe },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSourceTab(value)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                sourceTab === value
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Status tabs + actions row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/20 p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusTab(t.value)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                statusTab === t.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setRefreshTick((n) => n + 1)}
            className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {sourceTab === "web" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleFindRfps}
            disabled={searching}
            className="gap-1.5"
          >
            {searching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            {searching ? "Searching…" : "Find RFPs for us"}
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-gap/30 bg-gap/10 px-4 py-3 text-sm text-gap">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <EmptyState sourceTab={sourceTab} statusTab={statusTab} />
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              acting={acting[c.id]}
              onApprove={statusTab === "pending" ? () => handleApprove(c.id) : undefined}
              onReject={statusTab === "pending" ? () => handleReject(c.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  sourceTab,
  statusTab,
}: {
  sourceTab: SourceTab
  statusTab: RfpCandidateStatus
}) {
  const Icon = sourceTab === "email" ? Mail : Globe

  let message: React.ReactNode
  if (statusTab === "pending") {
    message =
      sourceTab === "email" ? (
        <>
          No pending email RFPs. Forward an RFP to your intake address or{" "}
          <a href="/settings" className="text-primary hover:underline">
            connect Gmail
          </a>
          .
        </>
      ) : (
        <>
          No web-discovered RFPs yet. Click{" "}
          <span className="font-medium text-foreground">"Find RFPs for us"</span> to search
          the web.
        </>
      )
  } else {
    message = `No ${statusTab} opportunities from ${sourceTab === "email" ? "email" : "web discovery"}.`
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-10 text-center">
      <Icon className="mx-auto mb-3 size-8 text-muted-foreground/30" />
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
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
  const isWebSearch = c.source === "research_agent"

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/20">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                isWebSearch
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground"
              )}
            >
              {isWebSearch ? <Globe className="size-2.5" /> : <Mail className="size-2.5" />}
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
            "min-w-[3.5rem] shrink-0 rounded-lg px-3 py-1.5 text-center",
            fitColor(score)
          )}
        >
          <p className="text-lg font-bold leading-none">{score}</p>
          <p className="text-[10px] uppercase tracking-wide opacity-70">fit</p>
        </div>
      </div>

      {/* Fit bar — web search only */}
      {isWebSearch && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Domain fit
            </span>
            <span className={cn("text-[11px] font-semibold", fitColor(score).split(" ")[0])}>
              {score}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", fitBarColor(score))}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta */}
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
        {isWebSearch && c.sourceRef?.url && (
          <a
            href={c.sourceRef.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            View source
          </a>
        )}
      </div>

      {/* Classification reason — inline italic for web, expandable for email */}
      {isWebSearch && c.classificationReason && (
        <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
          {c.classificationReason}
        </p>
      )}

      {c.projectOverview && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {c.projectOverview}
        </p>
      )}

      {!isWebSearch && c.classificationReason && (
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
            Why flagged as RFP
          </summary>
          <p className="mt-1 border-l border-border pl-2 text-xs leading-relaxed text-muted-foreground">
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
