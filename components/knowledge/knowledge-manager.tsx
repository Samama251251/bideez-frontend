"use client"

import * as React from "react"
import {
  CheckCircle2,
  FileText,
  Loader2,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getAccessToken, uploadFileToSignedUrl } from "@/lib/api/browser"
import {
  confirmKnowledgeUploaded,
  createKnowledge,
  deleteKnowledge,
  getKnowledgeUploadUrl,
  listKnowledge,
  retryKnowledge,
} from "@/lib/api/knowledge"
import type { KnowledgeDocument } from "@/lib/api/types"

const POLL_INTERVAL_MS = 3000
const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Strip the extension to use as a sensible default title. */
function titleFromFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "")
}

export function KnowledgeManager({
  initialDocuments,
}: {
  initialDocuments: KnowledgeDocument[]
}) {
  const [docs, setDocs] = React.useState<KnowledgeDocument[]>(initialDocuments)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const hasPending = docs.some((d) => !d.ready)

  /* --- Poll while any document is still parsing ----------------------- */
  React.useEffect(() => {
    if (!hasPending) return
    const interval = setInterval(async () => {
      try {
        const token = await getAccessToken()
        const { documents } = await listKnowledge(token)
        setDocs(documents)
      } catch {
        // transient — retry on next tick
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [hasPending])

  async function handleFile(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const token = await getAccessToken()
      const { id } = await createKnowledge(titleFromFilename(file.name), token)
      const { token: uploadToken, storagePath } = await getKnowledgeUploadUrl(
        id,
        file.name,
        token
      )
      await uploadFileToSignedUrl(storagePath, uploadToken, file)
      await confirmKnowledgeUploaded(id, storagePath, token)
      // Refresh the list so the new (parsing) doc shows and polling kicks in.
      const { documents } = await listKnowledge(token)
      setDocs(documents)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleRetry(id: string) {
    setBusyId(id)
    try {
      const token = await getAccessToken()
      await retryKnowledge(id, token)
      const { documents } = await listKnowledge(token)
      setDocs(documents)
    } catch {
      // ignore — list reflects current state
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const token = await getAccessToken()
      await deleteKnowledge(id, token)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // ignore
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
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
          if (file && !uploading) handleFile(file)
        }}
        className={cn(
          "rounded-2xl border border-dashed p-8 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
        />
        {uploading ? (
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground/60" />
        ) : (
          <UploadCloud className="mx-auto size-8 text-muted-foreground/50" />
        )}
        <h2 className="mt-3 font-display text-lg font-semibold tracking-tight">
          {uploading ? "Uploading…" : "Add a knowledge document"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Drop a PDF or DOCX — policies, certifications, past proposals. It&apos;s parsed
          and added to the evidence the matcher draws on.
        </p>
        {uploadError && <p className="mt-3 text-sm text-gap">{uploadError}</p>}
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse files
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="font-display text-sm font-semibold tracking-tight">Documents</h3>
          <span className="font-mono text-[11px] text-muted-foreground">{docs.length}</span>
        </div>

        {docs.length === 0 ? (
          <p className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No documents yet. Upload one above — it&apos;ll feed the gap analysis on every RFP.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    Added {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {doc.ready ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-go/10 px-2.5 py-0.5 text-xs font-medium text-go">
                    <CheckCircle2 className="size-3.5" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Loader2 className="size-3.5 animate-spin" /> Parsing
                  </span>
                )}

                {!doc.ready && (
                  <button
                    type="button"
                    title="Retry parsing"
                    disabled={busyId === doc.id}
                    onClick={() => handleRetry(doc.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    <RotateCw className={cn("size-4", busyId === doc.id && "animate-spin")} />
                  </button>
                )}

                <button
                  type="button"
                  title="Delete document"
                  disabled={busyId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-gap/10 hover:text-gap disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
