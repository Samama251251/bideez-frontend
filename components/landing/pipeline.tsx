"use client"

import * as React from "react"
import {
  ScanSearch,
  GitCompareArrows,
  SplitSquareVertical,
  PenLine,
  Send,
  ShieldCheck,
  Mic,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Phase = {
  id: string
  tag: string
  title: string
  blurb: string
  addon?: boolean
  steps: { icon: LucideIcon; label: string; detail: string }[]
}

const phases: Phase[] = [
  {
    id: "decide",
    tag: "01 / DECIDE",
    title: "Decide before you draft",
    blurb:
      "Parse the tender, build the compliance matrix, score the odds — then let a human pull the GO/NO-GO trigger.",
    steps: [
      {
        icon: ScanSearch,
        label: "Parse & extract",
        detail:
          "PDF/DOCX → clean text with page anchors. Mandatory requirements, evaluation weights, Q&A and deadline pulled into a structured skeleton.",
      },
      {
        icon: GitCompareArrows,
        label: "Match & gap analysis",
        detail:
          "RAG over your capability library scores each requirement. Unmatched ones become gaps — ranked Critical, Scored, or Minor.",
      },
      {
        icon: SplitSquareVertical,
        label: "GO / NO-GO gate",
        detail:
          "The engine recommends from critical gaps + win-probability. A human makes the call. NO-GO stops the line right here.",
      },
    ],
  },
  {
    id: "create",
    tag: "02 / CREATE",
    title: "Draft, then route the gaps",
    blurb:
      "Generate a compliant proposal mapped to retrieved evidence — and send the holes to the people who can fill them.",
    steps: [
      {
        icon: PenLine,
        label: "Draft agent",
        detail:
          "Each question is answered from matched evidence. Gap sections get a flagged placeholder — never a hallucination.",
      },
      {
        icon: Send,
        label: "SME routing",
        detail:
          "Flagged gaps and low-confidence sections are emailed to the right internal experts. Their input loops back into the draft.",
      },
    ],
  },
  {
    id: "verify",
    tag: "03 / VERIFY",
    title: "Verify before you submit",
    blurb:
      "Re-check the finished draft against every mandatory requirement — the pre-submission safety net.",
    steps: [
      {
        icon: ShieldCheck,
        label: "Final compliance re-check",
        detail:
          "Run the compliance matrix against the finished draft, not just the library, to confirm every mandatory item is actually covered.",
      },
      {
        icon: GitCompareArrows,
        label: "Evaluator simulation",
        detail:
          "An agent role-plays the evaluation panel, predicts your score against the stated weights, and suggests fixes before export.",
      },
    ],
  },
  {
    id: "defend",
    tag: "04 / DEFEND",
    title: "Rehearse the buyer call",
    addon: true,
    blurb:
      "Optional add-on. A voice agent interrogates the exact weaknesses the engine flagged, then scores your defense.",
    steps: [
      {
        icon: Mic,
        label: "Oral rehearsal",
        detail:
          "Activates once a proposal is final. A skeptical buyer asks the hardest questions first — drawn from gaps and the heaviest-weighted criteria — and coaches each answer.",
      },
    ],
  },
]

export function Pipeline() {
  const [active, setActive] = React.useState("decide")
  const current = phases.find((p) => p.id === active)!

  return (
    <div className="grid gap-8">
      {/* rail */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {phases.map((p, i) => {
          const isActive = p.id === active
          return (
            <React.Fragment key={p.id}>
              <button
                onClick={() => setActive(p.id)}
                className={cn(
                  "group relative flex-1 rounded-2xl border px-4 py-3.5 text-left transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/10 shadow-sm"
                    : "glass-subtle hover:border-foreground/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-[0.16em]",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {p.tag}
                  </span>
                  {p.addon && (
                    <span className="rounded-full border border-border/70 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground">
                      ADD-ON
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 font-display text-base font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {p.title}
                </p>
                {isActive && (
                  <span className="absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent sm:hidden" />
                )}
              </button>
              {i < phases.length - 1 && (
                <div className="hidden items-center sm:flex" aria-hidden>
                  <div className="h-px w-3 bg-border" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* detail panel */}
      <div
        key={current.id}
        className="animate-rise glass rounded-3xl p-6 sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-mono text-xs tracking-[0.16em] text-primary">
              {current.tag}
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance">
              {current.title}
            </h3>
            <p className="mt-3 max-w-sm text-muted-foreground">
              {current.blurb}
            </p>
          </div>

          <ol className="grid gap-3">
            {current.steps.map((s, i) => {
              const Icon = s.icon
              return (
                <li
                  key={s.label}
                  className="group glass-subtle flex gap-4 rounded-2xl p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-primary">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h4 className="font-medium">{s.label}</h4>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {s.detail}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
