"use client"

import * as React from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
  Pencil,
  Quote,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getAccessToken } from "@/lib/api/browser"
import { overrideRequirement, recordDecision } from "@/lib/api/workspaces"
import type {
  AnalysisEvidence,
  AnalysisRequirement,
  AnalysisResponse,
  EvidenceSourceType,
  GapSeverity,
  GoDecision,
  RequirementCategory,
  RequirementsResponse,
} from "@/lib/api/types"
import {
  CategoryTabs,
  firstNonEmptyCategory,
  groupByCategory,
} from "@/components/workspaces/category-tabs"

/* --- severity → on-palette styling ------------------------------------- */

type SeverityMeta = {
  label: string
  text: string
  chip: string
  bar: string
}

function severityMeta(severity: GapSeverity, matched: boolean): SeverityMeta {
  switch (severity) {
    case "critical":
      return {
        label: "Critical gap",
        text: "text-gap",
        chip: "bg-gap/10 text-gap",
        bar: "bg-gap",
      }
    case "scored":
      return {
        label: "Partial — scored",
        text: "text-scored",
        chip: "bg-scored/10 text-scored",
        bar: "bg-scored",
      }
    case "minor":
      return {
        label: "Minor gap",
        text: "text-scored",
        chip: "bg-scored/10 text-scored",
        bar: "bg-scored",
      }
    default:
      return {
        label: matched ? "Matched" : "No gap",
        text: "text-go",
        chip: "bg-go/10 text-go",
        bar: "bg-go",
      }
  }
}

const SEVERITY_ORDER: Record<GapSeverity, number> = {
  critical: 0,
  scored: 1,
  minor: 2,
  none: 3,
}

const EVIDENCE_SOURCE: Record<
  EvidenceSourceType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  capability: { label: "Capability", icon: ShieldCheck },
  historical_bid: { label: "Past bid", icon: History },
  knowledge_document: { label: "Knowledge doc", icon: BookOpen },
}

/* ----------------------------------------------------------------------- */

export function AnalysisView({
  workspaceId,
  analysis,
  requirements,
  onGoDecision,
}: {
  workspaceId: string
  analysis: AnalysisResponse
  requirements: RequirementsResponse | null
  /** Called after a GO or NO-GO decision is successfully recorded. */
  onGoDecision?: (decision: "go" | "no_go") => void
}) {
  const [decision, setDecision] = React.useState<GoDecision>(analysis.goDecision)
  const [submitting, setSubmitting] = React.useState<GoDecision | null>(null)
  const [decisionError, setDecisionError] = React.useState<string | null>(null)
  const [reqs, setReqs] = React.useState<AnalysisRequirement[]>(analysis.requirements)

  function handleReqUpdate(updated: AnalysisRequirement) {
    setReqs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  async function submit(next: "go" | "no_go") {
    setSubmitting(next)
    setDecisionError(null)
    try {
      const token = await getAccessToken()
      const res = await recordDecision(workspaceId, next, token)
      setDecision(res.goDecision)
      // Notify parent so it can transition status or navigate.
      onGoDecision?.(next)
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "Could not save decision")
    } finally {
      setSubmitting(null)
    }
  }

  const passCount = reqs.filter((r) => r.isMatched).length
  const failCount = reqs.filter((r) => !r.isMatched).length
  const total = reqs.length

  return (
    <div className="space-y-6">
      {(requirements?.buyerName || requirements?.deadline) && (
        <div className="flex flex-wrap gap-6 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
          {requirements?.buyerName && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                BUYER
              </span>
              <p className="font-medium">{requirements.buyerName}</p>
            </div>
          )}
          {requirements?.deadline && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                DEADLINE
              </span>
              <p className="font-medium">
                {new Date(requirements.deadline).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      <RecommendationGate
        recommended={analysis.recommendedDecision}
        rationale={analysis.decisionRationale}
        decision={decision}
        submitting={submitting}
        error={decisionError}
        onDecide={submit}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <WinProbabilityCard winProbability={analysis.winProbability} />
        <ChecklistCard passCount={passCount} failCount={failCount} total={total} />
      </div>

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="font-display text-sm font-semibold tracking-tight">
            Compliance matrix
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {reqs.length} requirements
          </span>
        </div>
        <CategorizedMatrix
          workspaceId={workspaceId}
          requirements={reqs}
          onReqUpdate={handleReqUpdate}
        />
      </div>

      {requirements && <ExtractionContext requirements={requirements} />}
    </div>
  )
}

/* --- Recommendation + GO/NO-GO gate ------------------------------------ */

function RecommendationGate({
  recommended,
  rationale,
  decision,
  submitting,
  error,
  onDecide,
}: {
  recommended: GoDecision
  rationale: string
  decision: GoDecision
  submitting: GoDecision | null
  error: string | null
  onDecide: (next: "go" | "no_go") => void
}) {
  const isGo = recommended === "go"
  const recommendsKnown = recommended !== "pending"

  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        recommendsKnown && isGo && "border-go/30 bg-go/5",
        recommendsKnown && !isGo && "border-gap/30 bg-gap/5",
        !recommendsKnown && "border-border bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 shrink-0",
            isGo ? "text-go" : recommendsKnown ? "text-gap" : "text-muted-foreground"
          )}
        >
          {isGo ? (
            <CheckCircle2 className="size-6" />
          ) : recommendsKnown ? (
            <TriangleAlert className="size-6" />
          ) : (
            <ShieldCheck className="size-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              System recommendation
            </span>
            <Badge
              className={cn(
                isGo ? "bg-go/15 text-go" : recommendsKnown ? "bg-gap/15 text-gap" : ""
              )}
              variant={recommendsKnown ? undefined : "outline"}
            >
              {recommended === "go" ? "GO" : recommended === "no_go" ? "NO-GO" : "Pending"}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{rationale}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {decision === "pending"
            ? "Record your decision to close the gate."
            : "Your decision is recorded — you can change it."}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={decision === "no_go" ? "default" : "outline"}
            className={cn(
              decision === "no_go" && "bg-gap text-gap-foreground hover:bg-gap/90"
            )}
            disabled={submitting !== null}
            onClick={() => onDecide("no_go")}
          >
            {submitting === "no_go" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ThumbsDown className="size-4" />
            )}
            No-Go
          </Button>
          <Button
            type="button"
            variant={decision === "go" ? "default" : "outline"}
            className={cn(decision === "go" && "bg-go text-go-foreground hover:bg-go/90")}
            disabled={submitting !== null}
            onClick={() => onDecide("go")}
          >
            {submitting === "go" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ThumbsUp className="size-4" />
            )}
            Go
          </Button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-gap">{error}</p>}
    </div>
  )
}

/* --- Win probability (v1 placeholder) ---------------------------------- */

function WinProbabilityCard({
  winProbability,
}: {
  winProbability: AnalysisResponse["winProbability"]
}) {
  const { overall } = winProbability
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Win probability
        </span>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          v1 estimate
        </Badge>
      </div>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">
          {overall}
        </span>
        <span className="mb-1 text-lg text-muted-foreground">%</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${overall}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Derived from the compliance pass-rate. Multi-criteria scoring (budget,
        competitors, domain win-rate) lands in a later pass.
      </p>
    </div>
  )
}

/* --- Checklist summary -------------------------------------------------- */

function ChecklistCard({
  passCount,
  failCount,
  total,
}: {
  passCount: number
  failCount: number
  total: number
}) {
  const passPct = total > 0 ? (passCount / total) * 100 : 0
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Requirement coverage
      </span>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-4xl font-semibold tracking-tight tabular-nums text-go">
          {passCount}
        </span>
        <span className="mb-1 text-lg text-muted-foreground">/ {total} met</span>
      </div>
      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-gap/30">
        <div
          className="h-full rounded-full bg-go transition-all"
          style={{ width: `${passPct}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-go">{passCount} matched</span> ·{" "}
        <span className="font-medium text-gap">{failCount} with gaps</span>
      </p>
    </div>
  )
}

/* --- Tabbed compliance matrix (by category) ---------------------------- */

function CategorizedMatrix({
  workspaceId,
  requirements,
  onReqUpdate,
}: {
  workspaceId: string
  requirements: AnalysisRequirement[]
  onReqUpdate: (updated: AnalysisRequirement) => void
}) {
  const grouped = React.useMemo(() => groupByCategory(requirements), [requirements])
  const counts = React.useMemo(
    () =>
      ({
        vendor: grouped.vendor.length,
        compliance: grouped.compliance.length,
        product: grouped.product.length,
        admin: grouped.admin.length,
      }) as Record<RequirementCategory, number>,
    [grouped]
  )
  const [active, setActive] = React.useState<RequirementCategory>(() =>
    firstNonEmptyCategory(counts)
  )

  // Matched categories: rows sorted by gap severity. Admin: a self-attested checklist.
  const items = React.useMemo(
    () =>
      [...grouped[active]].sort(
        (a, b) => SEVERITY_ORDER[a.gapSeverity] - SEVERITY_ORDER[b.gapSeverity]
      ),
    [grouped, active]
  )

  return (
    <>
      <CategoryTabs active={active} counts={counts} onChange={setActive} />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None in this category.</p>
      ) : active === "admin" ? (
        <AdminChecklist items={items} />
      ) : (
        <div className="space-y-2.5">
          {items.map((req) => (
            <RequirementRow
              key={req.id}
              req={req}
              workspaceId={workspaceId}
              onUpdate={onReqUpdate}
            />
          ))}
        </div>
      )}
    </>
  )
}

/**
 * Admin requirements are submission rules — not matched against the knowledge base.
 * Render them as a plain self-attested checklist (text + anchor + severity), with none
 * of the match-bar / evidence affordances of a corpus-matched requirement.
 */
function AdminChecklist({ items }: { items: AnalysisRequirement[] }) {
  return (
    <ul className="space-y-2">
      {items.map((req) => (
        <li
          key={req.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-muted-foreground/50" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  req.severity === "mandatory"
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {req.severity}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{req.text}</p>
            {req.sourceAnchor && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {req.sourceAnchor}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/* --- Compliance matrix row + evidence drill-down ----------------------- */

function RequirementRow({
  req,
  workspaceId,
  onUpdate,
}: {
  req: AnalysisRequirement
  workspaceId: string
  onUpdate: (updated: AnalysisRequirement) => void
}) {
  const [evidenceOpen, setEvidenceOpen] = React.useState(false)
  const [overrideOpen, setOverrideOpen] = React.useState(false)
  const meta = severityMeta(req.gapSeverity, req.isMatched)
  const hasEvidence = req.evidence.length > 0

  return (
    <>
      <div className="group overflow-hidden rounded-xl border border-border bg-background/40">
        <div className="flex items-start gap-3 p-4">
          <div className={cn("mt-0.5 shrink-0", meta.text)}>
            {req.isMatched ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <XCircle className="size-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  req.severity === "mandatory"
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {req.severity}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>
                {meta.label}
              </span>
              {req.userOverride && (
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-500">
                  Human override
                </span>
              )}
            </div>

            <p className="mt-2 text-sm leading-relaxed">{req.text}</p>

            {req.userNote && (
              <p className="mt-1.5 border-l-2 border-purple-400/40 pl-3 text-[12px] italic leading-relaxed text-muted-foreground">
                Override note: {req.userNote}
              </p>
            )}

            {req.sourceAnchor && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {req.sourceAnchor}
              </p>
            )}

            {req.matchConfidence !== null && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full", meta.bar)}
                    style={{ width: `${req.matchConfidence}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {req.matchConfidence}% match
                </span>
              </div>
            )}

            {hasEvidence && (
              <button
                type="button"
                onClick={() => setEvidenceOpen((v) => !v)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform", evidenceOpen && "rotate-180")}
                />
                {req.evidence.length} supporting{" "}
                {req.evidence.length === 1 ? "source" : "sources"}
              </button>
            )}
          </div>

          {/* Override button — subtle, appears on hover */}
          <button
            type="button"
            onClick={() => setOverrideOpen(true)}
            title="Override verdict"
            className={cn(
              "mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-all",
              "opacity-0 group-hover:opacity-100",
              "hover:bg-muted hover:text-muted-foreground",
              req.userOverride && "opacity-100 text-purple-400/70 hover:text-purple-500"
            )}
          >
            <Pencil className="size-3.5" />
          </button>
        </div>

        {hasEvidence && evidenceOpen && (
          <div className="space-y-2 border-t border-border bg-muted/40 p-4">
            {req.evidence.map((ev, i) => (
              <EvidenceCard key={`${ev.sourceId}-${i}`} evidence={ev} />
            ))}
          </div>
        )}
      </div>

      <OverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        req={req}
        workspaceId={workspaceId}
        onSave={onUpdate}
      />
    </>
  )
}

/* --- Override verdict dialog ------------------------------------------- */

function OverrideDialog({
  open,
  onOpenChange,
  req,
  workspaceId,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  req: AnalysisRequirement
  workspaceId: string
  onSave: (updated: AnalysisRequirement) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Remount the form fresh each time the dialog opens by keying on req.id + open */}
        {open && (
          <OverrideForm
            key={req.id}
            req={req}
            workspaceId={workspaceId}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function OverrideForm({
  req,
  workspaceId,
  onSave,
  onCancel,
}: {
  req: AnalysisRequirement
  workspaceId: string
  onSave: (updated: AnalysisRequirement) => void
  onCancel: () => void
}) {
  const [isMatched, setIsMatched] = React.useState<boolean>(req.isMatched)
  const [gapSeverity, setGapSeverity] = React.useState<GapSeverity>(
    req.gapSeverity === "none" ? "critical" : req.gapSeverity
  )
  const [note, setNote] = React.useState<string>(req.userNote ?? "")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const noteRequired = isMatched
  const canSave = !saving && (!noteRequired || note.trim().length > 0)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const res = await overrideRequirement(
        workspaceId,
        req.id,
        {
          isMatched,
          gapSeverity: isMatched ? "none" : gapSeverity,
          note: note.trim() || null,
        },
        token
      )
      onSave({
        ...req,
        isMatched: res.isMatched,
        gapSeverity: res.gapSeverity,
        userOverride: res.userOverride,
        userNote: res.userNote,
      })
      onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save override")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Override verdict</DialogTitle>
        <DialogDescription className="line-clamp-2 text-[12px]">
          {req.text}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Verdict toggle */}
        <fieldset>
          <legend className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Verdict
          </legend>
          <div className="flex gap-2">
            {(
              [
                { value: true, label: "Satisfiable" },
                { value: false, label: "Not satisfiable" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setIsMatched(value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  isMatched === value
                    ? value
                      ? "border-go/50 bg-go/10 text-go"
                      : "border-gap/50 bg-gap/10 text-gap"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Gap severity — only when not satisfiable */}
        {!isMatched && (
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Gap severity
            </label>
            <div className="flex gap-1.5">
              {(["minor", "scored", "critical"] as GapSeverity[]).map((s) => {
                const m = severityMeta(s, false)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGapSeverity(s)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity",
                      m.chip,
                      gapSeverity === s
                        ? "ring-2 ring-current ring-offset-1"
                        : "opacity-50 hover:opacity-80"
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Note textarea */}
        <div>
          <label
            htmlFor="override-note"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Reason for override{noteRequired ? "" : " (optional)"}
          </label>
          <textarea
            id="override-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              noteRequired
                ? "Explain why this requirement is satisfiable…"
                : "Optional: explain your reasoning…"
            }
            className={cn(
              "w-full resize-none rounded-lg border bg-muted/30 px-3 py-2 text-sm leading-relaxed",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring",
              noteRequired && note.trim().length === 0 ? "border-gap/40" : "border-border"
            )}
          />
          {noteRequired && note.trim().length === 0 && (
            <p className="mt-1 text-[11px] text-gap">Required when marking as satisfiable.</p>
          )}
        </div>

        {error && <p className="text-sm text-gap">{error}</p>}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!canSave} onClick={handleSave}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save override
        </Button>
      </DialogFooter>
    </>
  )
}

function EvidenceCard({ evidence }: { evidence: AnalysisEvidence }) {
  const source = EVIDENCE_SOURCE[evidence.sourceType]
  const Icon = source?.icon ?? Quote
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {source?.label ?? evidence.sourceType}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {evidence.confidence}%
        </span>
      </div>
      <blockquote className="mt-2 flex gap-2 text-sm leading-relaxed text-foreground/90">
        <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
        <span>{evidence.snippet}</span>
      </blockquote>
      {evidence.sourceAnchor && (
        <p className="mt-1.5 pl-5.5 font-mono text-[11px] text-muted-foreground">
          {evidence.sourceAnchor}
        </p>
      )}
    </div>
  )
}

/* --- Secondary: extraction context ------------------------------------- */

function ExtractionContext({ requirements }: { requirements: RequirementsResponse }) {
  const [open, setOpen] = React.useState(false)
  const { evaluationCriteria, questions, projectOverview } = requirements
  const hasContent =
    Boolean(projectOverview) || evaluationCriteria.length > 0 || questions.length > 0
  if (!hasContent) return null

  return (
    <div className="rounded-2xl border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <span className="font-display text-sm font-semibold tracking-tight">
          Extracted context
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border p-4">
          {projectOverview && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                PROJECT OVERVIEW
              </span>
              <p className="mt-1 text-sm leading-relaxed">{projectOverview}</p>
            </div>
          )}

          {evaluationCriteria.length > 0 && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                EVALUATION CRITERIA
              </span>
              <ul className="mt-2 space-y-2">
                {evaluationCriteria.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm"
                  >
                    <span>{c.criterion}</span>
                    {c.weight && (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {c.weight}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {questions.length > 0 && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                QUESTIONS
              </span>
              <ul className="mt-2 space-y-2">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="rounded-lg border border-border bg-background/40 p-3 text-sm"
                  >
                    {q.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
