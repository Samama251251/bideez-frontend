"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  FileText,
  Loader2,
  RotateCw,
  UploadCloud,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/workspaces/status-pill"
import { AnalysisView } from "@/components/workspaces/analysis-view"
import { PipelineStepper } from "@/components/workspaces/pipeline-stepper"
import { DraftingPanel } from "@/components/workspaces/drafting-panel"
import { BidProposalView } from "@/components/workspaces/bid-proposal-view"
import { getAccessToken, uploadFileToSignedUrl } from "@/lib/api/browser"
import {
  confirmUploaded,
  getAnalysis,
  getRequirements,
  getStatus,
  getUploadUrl,
  retryWorkspace,
  retryCreateWorkspace,
} from "@/lib/api/workspaces"
import type {
  AnalysisResponse,
  RequirementCategory,
  RequirementItem,
  RequirementsResponse,
  WorkspaceStatus,
} from "@/lib/api/types"
import {
  CategoryTabs,
  firstNonEmptyCategory,
  groupByCategory,
} from "@/components/workspaces/category-tabs"

const POLL_INTERVAL_MS = 2500
const CLIENT_TIMEOUT_MS = 5 * 60 * 1000
const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Statuses we keep polling on (includes CREATE phase drafting). */
function isProcessing(status: WorkspaceStatus) {
  return status === "parsing" || status === "analyzing" || status === "drafting"
}

export function ExtractionView({
  workspaceId,
  title,
  initialStatus,
  initialError,
  initialGoDecision,
}: {
  workspaceId: string
  title: string
  initialStatus: WorkspaceStatus
  initialError: string | null
  /** The recorded GO/NO-GO decision — used to determine which retry path to show on failure. */
  initialGoDecision?: string | null
}) {
  const router = useRouter()
  const [status, setStatus] = React.useState<WorkspaceStatus>(initialStatus)
  const [error, setError] = React.useState<string | null>(initialError)
  const [goDecision, setGoDecision] = React.useState<string | null>(initialGoDecision ?? null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [timedOut, setTimedOut] = React.useState(false)
  const [data, setData] = React.useState<RequirementsResponse | null>(null)
  const [analysis, setAnalysis] = React.useState<AnalysisResponse | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /* --- Poll while parsing / analyzing --------------------------------- */
  React.useEffect(() => {
    if (!isProcessing(status)) return
    setTimedOut(false)
    const start = Date.now()

    const interval = setInterval(async () => {
      if (Date.now() - start > CLIENT_TIMEOUT_MS) {
        setTimedOut(true)
        clearInterval(interval)
        return
      }
      try {
        const token = await getAccessToken()
        const next = await getStatus(workspaceId, token)
        setStatus(next.status)
        setError(next.error)
        if (next.goDecision && next.goDecision !== "pending") {
          setGoDecision(next.goDecision)
        }
      } catch {
        // transient — retry on next tick
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, workspaceId])

  /* --- Fetch requirements as soon as they're available ---------------- */
  React.useEffect(() => {
    if (
      status !== "analyzing" &&
      status !== "decision" &&
      status !== "parsed" &&
      status !== "drafting" &&
      status !== "review" &&
      status !== "finalized"
    )
      return
    if (data) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        const result = await getRequirements(workspaceId, token)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load requirements"
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, workspaceId, data])

  /* --- Fetch the gap analysis once at the decision gate --------------- */
  React.useEffect(() => {
    if (status !== "decision" || analysis) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        const result = await getAnalysis(workspaceId, token)
        if (!cancelled) setAnalysis(result)
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load analysis"
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, workspaceId, analysis])

  /* --- Upload (intake → parsing) -------------------------------------- */
  async function handleFile(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const token = await getAccessToken()
      const { token: uploadToken, storagePath } = await getUploadUrl(
        workspaceId,
        file.name,
        token
      )
      await uploadFileToSignedUrl(storagePath, uploadToken, file)
      await confirmUploaded(workspaceId, storagePath, token)
      setStatus("parsing") // kicks off polling
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleRetry() {
    try {
      const token = await getAccessToken()
      await retryWorkspace(workspaceId, token)
      setError(null)
      setStatus("parsing")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed")
    }
  }

  async function handleRetryCreate() {
    try {
      const token = await getAccessToken()
      await retryCreateWorkspace(workspaceId, token)
      setError(null)
      setStatus("drafting")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <StatusPill status={status} />
      </div>

      {status === "failed" ? (
        <FailedPanel
          error={error}
          isCreatePhase={goDecision === "go"}
          onRetry={handleRetry}
          onRetryCreate={handleRetryCreate}
        />
      ) : (
        <>
          {/* Progress timeline — visible across the whole DECIDE flow. */}
          <PipelineStepper status={status} uploading={uploading} />

          {status === "intake" && (
            <UploadPanel
              uploading={uploading}
              uploadError={uploadError}
              accept={ACCEPT}
              fileInputRef={fileInputRef}
              onFile={handleFile}
            />
          )}

          {status === "parsing" && (
            <ProcessingPanel
              message="Extracting requirements — parsing the document and pulling out mandatory clauses, evaluation criteria and questions."
              timedOut={timedOut}
              onRetry={handleRetry}
            />
          )}

          {/* Extraction is done: surface the requirements while the gap
              analysis keeps running in the background. */}
          {status === "analyzing" && (
            <>
              <BackgroundBanner timedOut={timedOut} onRetry={handleRetry} />
              <ExtractionPanel data={data} />
            </>
          )}

          {/* Legacy rows that stopped at extraction. */}
          {status === "parsed" && <ExtractionPanel data={data} />}

          {status === "decision" &&
            (analysis ? (
              <AnalysisView
                workspaceId={workspaceId}
                analysis={analysis}
                requirements={data}
                onGoDecision={(decision) => {
                  if (decision === "go") {
                    setGoDecision("go")
                    setStatus("drafting")
                  } else {
                    // No-Go: navigate back to workspaces list
                    router.push("/workspaces")
                  }
                }}
              />
            ) : (
              <LoadingPanel message="Loading the gap analysis…" />
            ))}

          {/* CREATE phase — AI is generating the proposal */}
          {status === "drafting" && <DraftingPanel />}

          {/* CREATE phase — proposal ready for review / finalized */}
          {(status === "review" || status === "finalized") && (
            <BidProposalView workspaceId={workspaceId} />
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------- */

function UploadPanel({
  uploading,
  uploadError,
  accept,
  fileInputRef,
  onFile,
}: {
  uploading: boolean
  uploadError: string | null
  accept: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFile: (file: File) => void
}) {
  const [dragOver, setDragOver] = React.useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file && !uploading) onFile(file)
      }}
      className={`rounded-2xl border border-dashed p-10 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      {uploading ? (
        <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground/60" />
      ) : (
        <UploadCloud className="mx-auto size-10 text-muted-foreground/50" />
      )}
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">
        {uploading ? "Uploading…" : "Upload your document"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Drop a PDF or DOCX here, or browse. Extraction starts automatically once
        the upload finishes.
      </p>
      {uploadError && <p className="mt-3 text-sm text-gap">{uploadError}</p>}
      <Button
        type="button"
        variant="outline"
        className="mt-5"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        Browse files
      </Button>
    </div>
  )
}

function ProcessingPanel({
  message,
  timedOut,
  onRetry,
}: {
  message: string
  timedOut: boolean
  onRetry: () => void
}) {
  if (timedOut) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <AlertCircle className="size-4 shrink-0" />
        This is taking longer than expected.
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-auto"
        >
          <RotateCw className="size-3.5" /> Retry
        </Button>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
      <span className="leading-relaxed">{message} Updates automatically.</span>
    </div>
  )
}

function BackgroundBanner({
  timedOut,
  onRetry,
}: {
  timedOut: boolean
  onRetry: () => void
}) {
  if (timedOut) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <AlertCircle className="size-4 shrink-0" />
        The gap analysis is taking longer than expected.
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-auto"
        >
          <RotateCw className="size-3.5" /> Retry
        </Button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
      <span className="leading-relaxed text-foreground/80">
        <span className="font-medium text-foreground">
          Gap analysis is running in the background.
        </span>{" "}
        Here are the requirements we extracted — the compliance matrix and
        GO/NO-GO recommendation will appear here as soon as it finishes.
      </span>
    </div>
  )
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 shrink-0 animate-spin" />
      {message}
    </div>
  )
}

function FailedPanel({
  error,
  isCreatePhase = false,
  onRetry,
  onRetryCreate,
}: {
  error: string | null
  /** True when the failure occurred during the CREATE (drafting) phase. */
  isCreatePhase?: boolean
  onRetry: () => void
  onRetryCreate?: () => void
}) {
  return (
    <div className="rounded-2xl border border-gap/30 bg-gap/5 p-6">
      <div className="flex items-center gap-2 text-gap">
        <AlertCircle className="size-4" />
        <h2 className="font-display text-base font-semibold tracking-tight">
          {isCreatePhase ? "Proposal generation failed" : "Extraction failed"}
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {error ?? "Something went wrong."}
      </p>
      <div className="mt-4 flex items-center gap-2">
        {isCreatePhase && onRetryCreate ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRetryCreate}
          >
            <RotateCw className="size-4" /> Retry Proposal
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
          >
            <RotateCw className="size-4" /> Retry Extraction
          </Button>
        )}
      </div>
    </div>
  )
}

function ExtractionPanel({ data }: { data: RequirementsResponse | null }) {
  if (!data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Loading extracted requirements…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(data.buyerName || data.deadline) && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
          {data.buyerName && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                BUYER
              </span>
              <p className="font-medium">{data.buyerName}</p>
            </div>
          )}
          {data.deadline && (
            <div>
              <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                DEADLINE
              </span>
              <p className="font-medium">
                {new Date(data.deadline).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {data.projectOverview && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
            PROJECT OVERVIEW
          </span>
          <p className="mt-1 text-sm leading-relaxed">{data.projectOverview}</p>
        </div>
      )}

      <Section title="Requirements" count={data.requirements.length}>
        <RequirementsByCategory requirements={data.requirements} />
      </Section>

      <Section
        title="Evaluation criteria"
        count={data.evaluationCriteria.length}
      >
        <ul className="space-y-2">
          {data.evaluationCriteria.map((c) => (
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
      </Section>

      <Section title="Questions" count={data.questions.length}>
        <ul className="space-y-2">
          {data.questions.map((q) => (
            <li
              key={q.id}
              className="rounded-lg border border-border bg-background/40 p-3 text-sm"
            >
              {q.question}
              {q.sourceAnchor && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {q.sourceAnchor}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function RequirementsByCategory({
  requirements,
}: {
  requirements: RequirementItem[]
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
  const items = grouped[active]

  return (
    <>
      <CategoryTabs active={active} counts={counts} onChange={setActive} />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None in this category.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border bg-background/40 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span>{r.text}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    r.severity === "mandatory"
                      ? "bg-gap/10 text-gap"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.severity}
                </span>
              </div>
              {r.sourceAnchor && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {r.sourceAnchor}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {title}
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">None extracted.</p>
      ) : (
        children
      )}
    </div>
  )
}
