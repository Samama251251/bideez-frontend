"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAccessToken } from "@/lib/api/browser"
import { createWorkspace } from "@/lib/api/workspaces"
import type { DocumentType } from "@/lib/api/types"

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "rfp", label: "RFP" },
  { value: "rfq", label: "RFQ" },
  { value: "tender", label: "Tender" },
]

export function CreateWorkspace() {
  const router = useRouter()
  const [title, setTitle] = React.useState("")
  const [documentType, setDocumentType] = React.useState<DocumentType>("rfp")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const { workspaceId } = await createWorkspace({ title: title.trim(), documentType }, token)
      // Detail page handles the upload step (workspace starts in `intake`).
      router.push(`/workspaces/${workspaceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-muted/30 p-6"
    >
      <h2 className="font-display text-lg font-semibold tracking-tight">New workspace</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        One workspace per RFP / RFQ / Tender. You&apos;ll upload the document next.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="ws-title">Title</Label>
          <Input
            id="ws-title"
            placeholder="e.g. Acme Ministry Tender 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ws-type">Type</Label>
          <select
            id="ws-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            disabled={loading}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-28"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-gap">{error}</p>}

      <Button type="submit" disabled={loading || !title.trim()} className="mt-4">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create workspace
      </Button>
    </form>
  )
}
