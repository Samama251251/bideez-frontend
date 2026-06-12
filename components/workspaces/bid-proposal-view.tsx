"use client"

import * as React from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  FileText,
  Loader2,
  Mail,
  Mic,
  Phone,
  Save,
  Shield,
  Trophy,
  Users,
  UserPlus,
  X,
  DollarSign,
  Gavel,
  BarChart3,
} from "lucide-react"
import { pdf } from "@react-pdf/renderer"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Markdown } from "@/components/ui/markdown"
import { getAccessToken } from "@/lib/api/browser"
import {
  ApiError,
  finalizeProposal,
  getLearnings,
  getProposal,
  recordOutcome,
  sendReviews,
  setSectionReviewers,
  updateProposalSection,
} from "@/lib/api/workspaces"
import { ProposalPDFDocument } from "@/components/workspaces/proposal-pdf"
import { getLatestRehearsalScore } from "@/lib/api/rehearsal"
import type {
  AssignableMember,
  BidOutcome,
  ProposalResponse,
  ProposalSection,
  ProposalSectionType,
  WorkingMemory,
} from "@/lib/api/types"

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

export function BidProposalView({
  workspaceId,
  userId,
  userRole,
  companyId,
}: {
  workspaceId: string
  userId: string
  userRole: "owner" | "employee"
  companyId: string
}) {
  const isOwner = userRole === "owner"

  const [proposal, setProposal] = React.useState<ProposalResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [finalizing, setFinalizing] = React.useState(false)
  const [exportingPdf, setExportingPdf] = React.useState(false)
  const [notifying, setNotifying] = React.useState(false)
  const [notifyMessage, setNotifyMessage] = React.useState<string | null>(null)

  const loadProposal = React.useCallback(async () => {
    const token = await getAccessToken()
    const data = await getProposal(workspaceId, token)
    setProposal(data)
    return data
  }, [workspaceId])

  const [rehearsalScore, setRehearsalScore] = React.useState<number | null>(null)

  React.useEffect(() => {
    getLatestRehearsalScore(workspaceId).then(setRehearsalScore)
  }, [workspaceId, proposal?.status])

  // Load proposal sections on mount.
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadProposal()
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load proposal")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [loadProposal])

  const handleSectionUpdate = React.useCallback(
    (sectionId: string, patch: Partial<ProposalSection>) => {
      setProposal((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sectionId ? { ...s, ...patch } : s
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

  async function handleNotifyReviewers() {
    setNotifying(true)
    setNotifyMessage(null)
    try {
      const token = await getAccessToken()
      const result = await sendReviews(workspaceId, token)
      setNotifyMessage(
        result.notified > 0
          ? `Notified ${result.notified} reviewer${result.notified === 1 ? "" : "s"}.`
          : "No reviewers to notify."
      )
    } catch (err) {
      setNotifyMessage(err instanceof Error ? err.message : "Failed to send notifications")
    } finally {
      setNotifying(false)
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
  const unreviewedCount = proposal.sections.filter(
    (s) => s.reviewers.length > 0 && !s.reviewComplete
  ).length

  // Reviewers (non-owners) only see the sections they're assigned to.
  const visibleSections = isOwner
    ? proposal.sections
    : proposal.sections.filter((s) => s.reviewers.some((r) => r.userId === userId))

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
          {isOwner && !isFinalized && (
            <Button
              id="notify-reviewers-btn"
              variant="outline"
              size="sm"
              disabled={notifying}
              onClick={handleNotifyReviewers}
            >
              {notifying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Mark ready &amp; notify reviewers
            </Button>
          )}
          {isOwner && !isFinalized && (
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

      {notifyMessage && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          {notifyMessage}
        </div>
      )}

      {/* ---- Summary stats -------------------------------------------- */}
      {isOwner && (
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
      )}

      {/* ---- Placeholder warning banner ------------------------------- */}
      {isOwner && placeholderCount > 0 && (
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

      {/* ---- Unreviewed warning banner --------------------------------- */}
      {isOwner && !isFinalized && unreviewedCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-scored/30 bg-scored/5 p-4 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-scored" />
          <span className="leading-relaxed text-foreground/90">
            <span className="font-medium text-foreground">
              {unreviewedCount} section{unreviewedCount > 1 ? "s" : ""} still pending SME review.
            </span>{" "}
            You can finalize anyway, but reviewer feedback won&apos;t be captured.
          </span>
        </div>
      )}

      {/* ---- Sections ------------------------------------------------- */}
      {visibleSections.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          You have no sections assigned for review on this proposal.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleSections.map((section) => (
            <SectionCard
              key={section.id}
              workspaceId={workspaceId}
              section={section}
              isFinalized={isFinalized}
              isOwner={isOwner}
              userId={userId}
              assignableMembers={proposal.assignableMembers}
              onUpdate={handleSectionUpdate}
              onStale={loadProposal}
            />
          ))}
        </div>
      )}

      {/* ---- Rehearse CTA ------------------------------------------------ */}
      {isFinalized && (
        <RehearseCard
          workspaceId={workspaceId}
          companyId={companyId}
          rehearsalScore={rehearsalScore}
        />
      )}

      {/* ---- Finalized: outcome + lessons ------------------------------ */}
      {isFinalized && (
        <div className="space-y-3">
          {isOwner && <OutcomeForm workspaceId={workspaceId} />}
          <LessonsPanel workspaceId={workspaceId} />
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * SectionCard — individual section with inline edit + SME review
 * ------------------------------------------------------------------------- */

function SectionCard({
  workspaceId,
  section,
  isFinalized,
  isOwner,
  userId,
  assignableMembers,
  onUpdate,
  onStale,
}: {
  workspaceId: string
  section: ProposalSection
  isFinalized: boolean
  isOwner: boolean
  userId: string
  assignableMembers: AssignableMember[]
  onUpdate: (id: string, patch: Partial<ProposalSection>) => void
  onStale: () => Promise<unknown>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [assigning, setAssigning] = React.useState(false)
  const [markingDone, setMarkingDone] = React.useState(false)

  const meta = SECTION_META[section.sectionType]
  const Icon = meta.icon
  // Effective content: human override wins over AI draft.
  const displayContent = section.humanContent ?? section.content ?? ""

  const myReviewer = section.reviewers.find((r) => r.userId === userId)
  const isAssignedReviewer = !!myReviewer
  const canEdit = !isFinalized && (isOwner || isAssignedReviewer)

  function startEdit() {
    setEditValue(section.humanContent ?? section.content ?? "")
    setEditing(true)
    setOpen(true)
    setSaveError(null)
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
      const result = await updateProposalSection(
        workspaceId,
        section.id,
        { humanContent: editValue, baseUpdatedAt: section.updatedAt },
        token
      )
      onUpdate(section.id, {
        humanContent: result.humanContent,
        approved: result.approved,
        updatedAt: result.updatedAt,
        reviewers: result.reviewers,
        reviewComplete: result.reviewComplete,
      })
      setEditing(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSaveError("This section was edited since you opened it. Reloading the latest version…")
        await onStale()
        setEditing(false)
      } else {
        setSaveError(err instanceof Error ? err.message : "Save failed")
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleApproved() {
    try {
      const token = await getAccessToken()
      const result = await updateProposalSection(
        workspaceId,
        section.id,
        { approved: !section.approved },
        token
      )
      onUpdate(section.id, {
        approved: result.approved,
        updatedAt: result.updatedAt,
        reviewers: result.reviewers,
        reviewComplete: result.reviewComplete,
      })
    } catch {
      // transient — ignore
    }
  }

  async function markDone() {
    setMarkingDone(true)
    try {
      const token = await getAccessToken()
      const result = await updateProposalSection(
        workspaceId,
        section.id,
        { markDone: true },
        token
      )
      onUpdate(section.id, {
        updatedAt: result.updatedAt,
        reviewers: result.reviewers,
        reviewComplete: result.reviewComplete,
      })
    } catch {
      // transient — ignore
    } finally {
      setMarkingDone(false)
    }
  }

  async function saveReviewers(userIds: string[]) {
    const token = await getAccessToken()
    const result = await setSectionReviewers(workspaceId, section.id, userIds, token)
    onUpdate(section.id, {
      reviewers: result.reviewers,
      reviewComplete: result.reviewers.length > 0 && result.reviewers.every((r) => r.status === "done"),
    })
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
            {section.reviewers.length > 0 && (
              <Badge
                className={cn(
                  "text-[10px]",
                  section.reviewComplete
                    ? "bg-go/15 text-go"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {section.reviewComplete ? (
                  <CheckCircle2 className="mr-0.5 size-2.5" />
                ) : (
                  <Clock className="mr-0.5 size-2.5" />
                )}
                {section.reviewComplete ? "Review complete" : "Review pending"}
              </Badge>
            )}
          </div>
          {section.reviewers.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {section.reviewers.map((r) => (
                <span
                  key={r.userId}
                  className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {r.status === "done" ? (
                    <CheckCircle2 className="size-2.5 text-go" />
                  ) : (
                    <Clock className="size-2.5" />
                  )}
                  {r.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isFinalized && isAssignedReviewer && myReviewer?.status === "pending" && (
            <Button
              id={`mark-done-${section.sectionType}`}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={markingDone}
              onClick={markDone}
            >
              {markingDone ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Mark done
            </Button>
          )}
          {canEdit && (
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
          )}
          {isOwner && !isFinalized && (
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
          )}
          {isOwner && !isFinalized && (
            <Button
              id={`assign-reviewers-${section.sectionType}`}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => { setAssigning((v) => !v); setOpen(true) }}
            >
              <UserPlus className="size-3.5" />
              Assign
            </Button>
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
        <div className="border-t border-border/60 p-4 space-y-4">
          {assigning && isOwner && (
            <ReviewerAssign
              members={assignableMembers}
              selected={section.reviewers.map((r) => r.userId)}
              onSave={async (userIds) => {
                await saveReviewers(userIds)
                setAssigning(false)
              }}
              onCancel={() => setAssigning(false)}
            />
          )}

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
          ) : displayContent ? (
            <Markdown>{displayContent}</Markdown>
          ) : (
            <span className="text-sm italic text-muted-foreground">No content generated.</span>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * ReviewerAssign — owner-only multi-select of assignable members
 * ------------------------------------------------------------------------- */

function ReviewerAssign({
  members,
  selected,
  onSave,
  onCancel,
}: {
  members: AssignableMember[]
  selected: string[]
  onSave: (userIds: string[]) => Promise<void>
  onCancel: () => void
}) {
  const [picked, setPicked] = React.useState<Set<string>>(new Set(selected))
  const [saving, setSaving] = React.useState(false)

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      await onSave([...picked])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Assign reviewers
      </p>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <label
            key={m.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors",
              picked.has(m.id)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={picked.has(m.id)}
              onChange={() => toggle(m.id)}
            />
            {m.name}
            {m.department && <span className="text-muted-foreground/70">· {m.department}</span>}
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * OutcomeForm — record win/loss on a finalized proposal
 * ------------------------------------------------------------------------- */

function OutcomeForm({ workspaceId }: { workspaceId: string }) {
  const [outcome, setOutcome] = React.useState<BidOutcome | null>(null)
  const [reasons, setReasons] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit() {
    if (!outcome || !reasons.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const token = await getAccessToken()
      await recordOutcome(workspaceId, { outcome, reasons }, token)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record outcome")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-go/30 bg-go/5 p-4 text-sm text-foreground/90">
        <Trophy className="size-4 shrink-0 text-go" />
        Outcome recorded — thanks! We&apos;ll use this to improve future proposals.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-muted-foreground" />
        <h3 className="font-display text-sm font-semibold tracking-tight">Record bid outcome</h3>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={outcome === "win" ? "default" : "outline"}
          onClick={() => setOutcome("win")}
        >
          Win
        </Button>
        <Button
          type="button"
          size="sm"
          variant={outcome === "loss" ? "default" : "outline"}
          onClick={() => setOutcome("loss")}
        >
          Loss
        </Button>
      </div>
      <textarea
        id="outcome-reasons"
        value={reasons}
        onChange={(e) => setReasons(e.target.value)}
        rows={3}
        placeholder="Why did we win or lose? (pricing, scope fit, relationships, timeline...)"
        className="w-full resize-y rounded-xl border border-border bg-background/60 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {error && <p className="text-xs text-gap">{error}</p>}
      <Button
        id="submit-outcome-btn"
        type="button"
        size="sm"
        disabled={submitting || !outcome || !reasons.trim()}
        onClick={submit}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save outcome
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * LessonsPanel — learnings extracted from edits + outcomes
 * ------------------------------------------------------------------------- */

function LessonsPanel({ workspaceId }: { workspaceId: string }) {
  const [learnings, setLearnings] = React.useState<WorkingMemory[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        const result = await getLearnings(workspaceId, token)
        if (!cancelled) setLearnings(result.learnings)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load learnings")
      }
    })()
    return () => { cancelled = true }
  }, [workspaceId])

  if (error) return null
  if (!learnings || learnings.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-muted-foreground" />
        <h3 className="font-display text-sm font-semibold tracking-tight">
          Lessons learned from this proposal
        </h3>
      </div>
      <ul className="space-y-2">
        {learnings.map((l) => (
          <li key={l.id} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
            <Badge className="mb-1.5 bg-muted text-muted-foreground text-[10px]">{l.category}</Badge>
            <p className="leading-relaxed text-foreground/90">{l.content}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Stat card
 * ------------------------------------------------------------------------- */

function RehearseCard({
  workspaceId,
  companyId,
  rehearsalScore,
}: {
  workspaceId: string
  companyId: string
  rehearsalScore: number | null
}) {
  const href = `/dashboard/rehearsal?workspaceId=${encodeURIComponent(workspaceId)}&companyId=${encodeURIComponent(companyId)}`

  if (rehearsalScore !== null) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-go/30 bg-go/5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-go/20 bg-go/10">
            <Mic className="size-4.5 text-go" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">
              Last Rehearsal: {rehearsalScore}%
            </p>
            <p className="text-xs text-muted-foreground">
              Buyer call readiness score
            </p>
          </div>
        </div>
        <a
          href={href}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Phone className="size-4" />
          Rehearse Again
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-primary">
          <Mic className="size-4.5" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold tracking-tight">
            Ready for the buyer call?
          </p>
          <p className="text-xs text-muted-foreground">
            Rehearse with our AI buyer panel before submission
          </p>
        </div>
      </div>
      <a
        href={href}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Phone className="size-4" />
        Start Rehearsal
      </a>
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
