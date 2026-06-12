"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { RequirementCategory } from "@/lib/api/types"

/** Display order + labels for the four requirement categories (vendor first — highest match value). */
export const CATEGORY_ORDER: RequirementCategory[] = [
  "vendor",
  "compliance",
  "product",
  "admin",
]

export const CATEGORY_LABEL: Record<RequirementCategory, string> = {
  vendor: "Vendor",
  compliance: "Compliance",
  product: "Product",
  admin: "Admin",
}

/** Group requirements by category into a complete record (every category present). */
export function groupByCategory<T extends { category: RequirementCategory }>(
  items: T[]
): Record<RequirementCategory, T[]> {
  const out: Record<RequirementCategory, T[]> = {
    vendor: [],
    compliance: [],
    product: [],
    admin: [],
  }
  for (const item of items) out[item.category].push(item)
  return out
}

/** The first category (in display order) that has at least one item, else 'vendor'. */
export function firstNonEmptyCategory(
  counts: Record<RequirementCategory, number>
): RequirementCategory {
  return CATEGORY_ORDER.find((c) => counts[c] > 0) ?? "vendor"
}

/** Horizontal underline tabs across the four categories, with per-tab counts. */
export function CategoryTabs({
  active,
  counts,
  onChange,
}: {
  active: RequirementCategory
  counts: Record<RequirementCategory, number>
  onChange: (category: RequirementCategory) => void
}) {
  return (
    <div className="mb-4 flex gap-1 border-b border-border">
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === c
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {CATEGORY_LABEL[c]}
          <span className="font-mono text-[11px] text-muted-foreground">{counts[c]}</span>
        </button>
      ))}
    </div>
  )
}
