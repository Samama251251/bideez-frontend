"use client"

import * as React from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
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
import { getAccessToken } from "@/lib/api/browser"
import { recordDecision } from "@/lib/api/workspaces"
import type {
  AnalysisEvidence,
  AnalysisRequirement,
  AnalysisResponse,
  EvidenceSourceType,
  GapSeverity,
  GoDecision,
  RequirementsResponse,
} from "@/lib/api/types"

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
}: {
  workspaceId: string
  analysis: AnalysisResponse
  requirements: RequirementsResponse | null
}) {
  const [decision, setDecision] = React.useState<GoDecision>(analysis.goDecision)
  const [submitting, setSubmitting] = React.useState<GoDecision | null>(null)
  const [decisionError, setDecisionError] = React.useState<string | null>(null)

  async function submit(next: "go" | "no_go") {
    setSubmitting(next)
    setDecisionError(null)
    try {
      const token = await getAccessToken()
      const res = await recordDecision(workspaceId, next, token)
      setDecision(res.goDecision)
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "Could not save decision")
    } finally {
      setSubmitting(null)
    }
  }

  const sorted = React.useMemo(
    () =>
      [...analysis.requirements].sort(
        (a, b) => SEVERITY_ORDER[a.gapSeverity] - SEVERITY_ORDER[b.gapSeverity]
      ),
    [analysis.requirements]
  )

  const { passCount, failCount } = analysis.checklist
  const total = passCount + failCount

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
            {sorted.length} requirements
          </span>
        </div>
        <div className="space-y-2.5">
          {sorted.map((req) => (
            <RequirementRow key={req.id} req={req} />
          ))}
        </div>
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

/* --- Compliance matrix row + evidence drill-down ----------------------- */

function RequirementRow({ req }: { req: AnalysisRequirement }) {
  const [open, setOpen] = React.useState(false)
  const meta = severityMeta(req.gapSeverity, req.isMatched)
  const hasEvidence = req.evidence.length > 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40">
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
                req.kind === "mandatory"
                  ? "bg-foreground/10 text-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {req.kind}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>
              {meta.label}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed">{req.text}</p>

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
              onClick={() => setOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn("size-3.5 transition-transform", open && "rotate-180")}
              />
              {req.evidence.length} supporting{" "}
              {req.evidence.length === 1 ? "source" : "sources"}
            </button>
          )}
        </div>
      </div>

      {hasEvidence && open && (
        <div className="space-y-2 border-t border-border bg-muted/40 p-4">
          {req.evidence.map((ev, i) => (
            <EvidenceCard key={`${ev.sourceId}-${i}`} evidence={ev} />
          ))}
        </div>
      )}
    </div>
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
