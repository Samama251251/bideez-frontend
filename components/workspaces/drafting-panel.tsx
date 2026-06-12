"use client"

import * as React from "react"
import { Loader2, FileText, CheckSquare, Users, DollarSign, Shield } from "lucide-react"

const SECTION_LABELS = [
  { icon: FileText, label: "Cover Letter" },
  { icon: FileText, label: "Executive Summary" },
  { icon: CheckSquare, label: "Compliance Matrix" },
  { icon: Shield, label: "Company Overview" },
  { icon: FileText, label: "Technical Approach" },
  { icon: Users, label: "Past Performance" },
  { icon: Users, label: "Team Qualifications" },
  { icon: DollarSign, label: "Pricing & Commercials" },
  { icon: FileText, label: "Terms & Conditions" },
]

/**
 * Shown while status === "drafting" — the AI is generating proposal sections.
 * Auto-cycles through section names to give a sense of progress.
 */
export function DraftingPanel() {
  const [currentIdx, setCurrentIdx] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SECTION_LABELS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  const current = SECTION_LABELS[currentIdx]
  const Icon = current.icon

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Animated icon */}
        <div className="relative">
          <div className="flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Generating your bid proposal…
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Our AI is drafting each section of your proposal using your RFP analysis, capabilities, and past bids.
          </p>
        </div>

        {/* Currently generating section indicator */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm">
          <Icon className="size-4 text-primary" />
          <span className="font-medium">Writing:</span>
          <span className="text-muted-foreground transition-all">{current.label}</span>
        </div>

        {/* Section dots progress */}
        <div className="flex items-center gap-1.5">
          {SECTION_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIdx
                  ? "w-5 bg-primary"
                  : i < currentIdx
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          This usually takes 30–90 seconds. The page will update automatically.
        </p>
      </div>
    </div>
  )
}
