"use client"

import * as React from "react"
import { Loader2, Sparkles, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type Competitor = {
  name: string
  description: string
}

type Company = {
  id: string
  name: string
  domain?: string | null
  location?: string | null
  overview?: string | null
  industry?: string | null
  competitors?: Competitor[] | null
  enrichmentStatus?: "pending" | "enriching" | "complete" | "failed" | null
}

const POLL_INTERVAL_MS = 4000

export function CompanyEnrichment({
  email,
  initialCompany,
}: {
  email: string
  initialCompany: Company
}) {
  const [company, setCompany] = React.useState<Company>(initialCompany)

  const status = company.enrichmentStatus

  React.useEffect(() => {
    if (status !== "pending" && status !== "enriching") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(email)}`,
          { cache: "no-store" }
        )
        if (!res.ok) return

        const data = await res.json()
        if (data.company) {
          setCompany(data.company)
        }
      } catch {
        // Ignore transient polling errors; will retry on next interval.
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, email])

  if (status === "pending" || status === "enriching") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Researching your company&hellip; this updates automatically.
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <AlertCircle className="size-4 shrink-0" />
        We couldn&apos;t auto-fill your company details. You can add them manually later.
      </div>
    )
  }

  if (status !== "complete") return null

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border bg-muted/30 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="font-display text-sm font-semibold tracking-tight">
          Company research
        </h3>
        {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
      </div>

      {company.overview && (
        <p className="text-sm leading-relaxed text-muted-foreground">{company.overview}</p>
      )}

      {company.competitors && company.competitors.length > 0 && (
        <div>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            COMPETITORS
          </p>
          <ul className="mt-2 space-y-2">
            {company.competitors.map((competitor) => (
              <li key={competitor.name} className="text-sm">
                <span className="font-medium text-foreground">{competitor.name}</span>
                {competitor.description && (
                  <span className="text-muted-foreground"> — {competitor.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
