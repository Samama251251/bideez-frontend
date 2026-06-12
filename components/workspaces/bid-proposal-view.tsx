"use client"

import * as React from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  FileText,
  Loader2,
  Save,
  Shield,
  Users,
  X,
  DollarSign,
  Gavel,
  BarChart3,
} from "lucide-react"
import { pdf } from "@react-pdf/renderer"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAccessToken } from "@/lib/api/browser"
import { getProposal, updateProposalSection, finalizeProposal } from "@/lib/api/workspaces"
import { ProposalPDFDocument } from "@/components/workspaces/proposal-pdf"
import type { ProposalResponse, ProposalSection, ProposalSectionType } from "@/lib/api/types"

/* -------------------------------------------------------------------------
 * Section metadata
 * ------------------------------------------------------------------------- */

const SECTION_META: Record<
  ProposalSectionType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  cover_letter:        { icon: FileText,    color: "text-blue-500" },
  executive_summary:   { icon: BarChart3,   color: "text-purple-500" },
  compliance_matrix:   { icon: CheckCircle2,color: "text-green-500" },
  company_overview:    { icon: Shield,      color: "text-sky-500" },
  technical_approach:  { icon: FileText,    color: "text-orange-500" },
  past_performance:    { icon: BarChart3,   color: "text-indigo-500" },
  team_qualifications: { icon: Users,       color: "text-pink-500" },
  pricing:             { icon: DollarSign,  color: "text-yellow-500" },
  terms:               { icon: Gavel,       color: "text-slate-500" },
}

/* -------------------------------------------------------------------------
 * Main component
 * ------------------------------------------------------------------------- */

export function BidProposalView({ workspaceId }: { workspaceId: string }) {
  const [proposal, setProposal] = React.useState<ProposalResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [finalizing, setFinalizing] = React.useState(false)
  const [exportingPdf, setExportingPdf] = React.useState(false)

  // Load proposal sections on mount.
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        const data = await getProposal(workspaceId, token)
        if (!cancelled) setProposal(data)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load proposal")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspaceId])

  const handleSectionUpdate = React.useCallback(
    (sectionId: string, humanContent: string | null, approved: boolean) => {
      setProposal((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sectionId ? { ...s, humanContent, approved } : s
          ),
        }
      })
    },
    []
  )

  async function handleFinalize() {
    if (!proposal) return
    setFinalizing(true)
    try {
      const token = await getAccessToken()
      await finalizeProposal(workspaceId, token)
      setProposal((prev) => prev ? { ...prev, status: "finalized" } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize proposal")
    } finally {
      setFinalizing(false)
    }
  }

  async function handleExportPdf() {
    if (!proposal) return
    setExportingPdf(true)
    try {
      const blob = await pdf(
        <ProposalPDFDocument proposal={proposal} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bid-proposal-${workspaceId.slice(0, 8)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Loading bid proposal…
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? "Proposal not available"}
      </div>
    )
  }

  const isFinalized = proposal.status === "finalized"
  const placeholderCount = proposal.sections.filter((s) => s.isPlaceholder).length
  const approvedCount = proposal.sections.filter((s) => s.approved).length

  return (
    <div className="space-y-6">
      {/* ---- Header ---------------------------------------------------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Bid Proposal Draft
            </h2>
            <Badge
              className={cn(
                isFinalized
                  ? "bg-go/15 text-go"
                  : "bg-scored/15 text-scored"
              )}
            >
              {isFinalized ? "Finalized" : "Draft"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {proposal.buyerName && <span className="font-medium">{proposal.buyerName}</span>}
            {proposal.deadline && (
              <span> · Due {new Date(proposal.deadline).toLocaleDateString()}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isFinalized && (
            <Button
              id="finalize-proposal-btn"
              variant="outline"
              size="sm"
              disabled={finalizing}
              onClick={handleFinalize}
            >
              {finalizing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Finalize
            </Button>
          )}
          <Button
            id="export-pdf-btn"
            size="sm"
            disabled={exportingPdf}
            onClick={handleExportPdf}
          >
            {exportingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* ---- Summary stats -------------------------------------------- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Sections" value={`${proposal.sections.length}`} />
        <StatCard
          label="Need Input"
          value={`${placeholderCount}`}
          highlight={placeholderCount > 0 ? "warning" : "ok"}
        />
        <StatCard
          label="Approved"
          value={`${approvedCount} / ${proposal.sections.length}`}
          highlight={approvedCount === proposal.sections.length ? "ok" : "neutral"}
        />
      </div>

      {/* ---- Placeholder warning banner ------------------------------- */}
      {placeholderCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-scored/30 bg-scored/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-scored" />
          <span className="leading-relaxed text-foreground/90">
            <span className="font-medium text-foreground">
              {placeholderCount} section{placeholderCount > 1 ? "s require" : " requires"} your input.
            </span>{" "}
            Look for the ⚠ badge and click Edit to fill in the missing details before exporting.
          </span>
        </div>
      )}

      {/* ---- Sections ------------------------------------------------- */}
      <div className="space-y-3">
        {proposal.sections.map((section) => (
          <SectionCard
            key={section.id}
            workspaceId={workspaceId}
            section={section}
            isFinalized={isFinalized}
            onUpdate={handleSectionUpdate}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * SectionCard — individual section with inline edit
 * ------------------------------------------------------------------------- */

function SectionCard({
  workspaceId,
  section,
  isFinalized,
  onUpdate,
}: {
  workspaceId: string
  section: ProposalSection
  isFinalized: boolean
  onUpdate: (id: string, humanContent: string | null, approved: boolean) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const meta = SECTION_META[section.sectionType]
  const Icon = meta.icon
  // Effective content: human override wins over AI draft.
  const displayContent = section.humanContent ?? section.content ?? ""

  function startEdit() {
    setEditValue(section.humanContent ?? section.content ?? "")
    setEditing(true)
    setOpen(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError(null)
  }

  async function saveEdit() {
    setSaving(true)
    setSaveError(null)
    try {
      const token = await getAccessToken()
      await updateProposalSection(workspaceId, section.id, { humanContent: editValue }, token)
      onUpdate(section.id, editValue, section.approved)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function toggleApproved() {
    try {
      const token = await getAccessToken()
      await updateProposalSection(workspaceId, section.id, { approved: !section.approved }, token)
      onUpdate(section.id, section.humanContent, !section.approved)
    } catch {
      // transient — ignore
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-background/40 transition-colors",
        section.approved ? "border-go/30" : "border-border"
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 p-4">
        <div className={cn("shrink-0", meta.color)}>
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold tracking-tight">
              {section.title}
            </span>
            {section.isPlaceholder && (
              <Badge className="bg-scored/15 text-scored text-[10px]">
                <AlertTriangle className="mr-0.5 size-2.5" />
                Input Required
              </Badge>
            )}
            {section.approved && (
              <Badge className="bg-go/15 text-go text-[10px]">
                <CheckCircle2 className="mr-0.5 size-2.5" />
                Approved
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isFinalized && (
            <>
              <Button
                id={`edit-section-${section.sectionType}`}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={startEdit}
              >
                <Edit3 className="size-3.5" />
                Edit
              </Button>
              <Button
                id={`approve-section-${section.sectionType}`}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs",
                  section.approved && "text-go hover:text-go/80"
                )}
                onClick={toggleApproved}
              >
                <Check className="size-3.5" />
                {section.approved ? "Approved" : "Approve"}
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/50"
          >
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-border/60 p-4">
          {editing ? (
            <div className="space-y-3">
              <textarea
                id={`section-editor-${section.sectionType}`}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={18}
                className="w-full resize-y rounded-xl border border-border bg-muted/30 p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {saveError && (
                <p className="text-xs text-gap">{saveError}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  id={`save-section-${section.sectionType}`}
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={saveEdit}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={cancelEdit}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
              style={{ fontFamily: "inherit" }}
            >
              {displayContent || (
                <span className="italic text-muted-foreground">No content generated.</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Stat card
 * ------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  highlight = "neutral",
}: {
  label: string
  value: string
  highlight?: "ok" | "warning" | "neutral"
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums",
          highlight === "ok" && "text-go",
          highlight === "warning" && "text-scored",
          highlight === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  )
}
