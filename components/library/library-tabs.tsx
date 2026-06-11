"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { Capability, HistoricalBid } from "@/lib/api/types"
import { CapabilitiesSection } from "./capabilities-section"
import { BidsSection } from "./bids-section"

type Tab = "capabilities" | "bids"

export function LibraryTabs({
  initialCapabilities,
  initialBids,
}: {
  initialCapabilities: Capability[]
  initialBids: HistoricalBid[]
}) {
  const [tab, setTab] = React.useState<Tab>("capabilities")

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        {(
          [
            { value: "capabilities", label: "Capability docs" },
            { value: "bids", label: "Bid history" },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "capabilities" ? (
        <CapabilitiesSection initial={initialCapabilities} />
      ) : (
        <BidsSection initial={initialBids} />
      )}
    </div>
  )
}
