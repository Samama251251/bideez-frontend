"use client"

import * as React from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/workspaces"
import type { ImportResult } from "@/lib/api/types"

export function FileImport({
  onImport,
  onImported,
}: {
  onImport: (file: File) => Promise<ImportResult>
  onImported: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await onImport(file)
      setResult(res)
      onImported()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
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
          if (file) void handleFile(file)
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20"
        }`}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-5 text-muted-foreground/60" />
        )}
        <p className="text-sm text-muted-foreground">
          Drag a .csv or .xlsx file here, or
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-gap">{error}</p>}

      {result && (
        <p className="mt-2 text-sm text-muted-foreground">
          Imported <span className="font-medium text-foreground">{result.inserted}</span> row
          {result.inserted === 1 ? "" : "s"}
          {result.skipped > 0 && <> · skipped {result.skipped} duplicate{result.skipped === 1 ? "" : "s"}</>}
          {result.errors.length > 0 && (
            <>
              {" "}
              · {result.errors.length} row{result.errors.length === 1 ? "" : "s"} had errors:{" "}
              {result.errors.slice(0, 3).join("; ")}
              {result.errors.length > 3 ? "…" : ""}
            </>
          )}
        </p>
      )}
    </div>
  )
}
