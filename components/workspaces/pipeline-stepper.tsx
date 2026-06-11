"use client"

import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { WorkspaceStatus } from "@/lib/api/types"

type StepState = "pending" | "active" | "done"

type Step = {
  key: string
  label: string
  sub: string
  state: StepState
  /** Show a spinner instead of a static dot while this step is working. */
  loading: boolean
}

/**
 * Vertical progress timeline for the DECIDE flow:
 * Upload → Extract requirements → Gap analysis → Decision.
 *
 * State is derived purely from the workspace status (+ the transient
 * `uploading` flag), so it stays in lock-step with the poller.
 */
export function PipelineStepper({
  status,
  uploading,
}: {
  status: WorkspaceStatus
  uploading: boolean
}) {
  const steps = buildSteps(status, uploading)

  return (
    <ol className="rounded-2xl border border-border bg-muted/20 p-5">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-7 left-[11px] h-[calc(100%-1rem)] w-px",
                  step.state === "done" ? "bg-go/40" : "bg-border"
                )}
              />
            )}

            <StepNode state={step.state} loading={step.loading} />

            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {step.label}
              </p>
              <p
                className={cn(
                  "text-xs",
                  step.state === "active" && step.loading
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {step.sub}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepNode({ state, loading }: { state: StepState; loading: boolean }) {
  return (
    <span
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
        state === "done" && "border-go bg-go text-go-foreground",
        state === "active" && "border-primary bg-background text-primary",
        state === "pending" && "border-border bg-background"
      )}
    >
      {state === "done" ? (
        <Check className="size-3.5" strokeWidth={3} />
      ) : state === "active" && loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === "active" ? (
        <span className="size-2 rounded-full bg-primary" />
      ) : (
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      )}
    </span>
  )
}

/* ------------------------------------------------------------------------- */

/** Rank statuses so we can derive done/active/pending per step. */
const PHASE_RANK: Record<WorkspaceStatus, number> = {
  intake: 0,
  parsing: 1,
  parsed: 2,
  analyzing: 2,
  decision: 3,
  drafting: 4,
  review: 4,
  finalized: 4,
  failed: 1,
  archived: 0,
}

function buildSteps(status: WorkspaceStatus, uploading: boolean): Step[] {
  const rank = PHASE_RANK[status]
  // `intake` means the upload step is current; it only spins while uploading.
  const uploadDone = rank >= 1
  const extractDone = rank >= 2
  const analysisDone = rank >= 3

  return [
    {
      key: "upload",
      label: "Upload document",
      state: uploadDone ? "done" : "active",
      loading: !uploadDone && uploading,
      sub: uploadDone
        ? "Document uploaded"
        : uploading
          ? "Uploading…"
          : "Drop in a PDF or DOCX to begin",
    },
    {
      key: "extract",
      label: "Extract requirements",
      state: extractDone ? "done" : uploadDone ? "active" : "pending",
      loading: !extractDone && uploadDone,
      sub: extractDone
        ? "Requirements extracted"
        : uploadDone
          ? "Reading the document and pulling out clauses…"
          : "Pending",
    },
    {
      key: "analyze",
      label: "Gap analysis",
      state: analysisDone ? "done" : extractDone ? "active" : "pending",
      loading: !analysisDone && extractDone,
      sub: analysisDone
        ? "Matched against your library"
        : extractDone
          ? "Scoring each requirement against your capabilities…"
          : "Pending",
    },
    {
      key: "decide",
      label: "GO / NO-GO decision",
      state: analysisDone ? "active" : "pending",
      loading: false,
      sub: analysisDone ? "Ready for your decision" : "Pending",
    },
  ]
}
