"use client"

import * as React from "react"
import { Loader2, Upload, Sparkles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/workspaces"
import type { ImportMethod } from "@/lib/api/library"
import type { ImportResult } from "@/lib/api/types"

export function FileImport({
  onImport,
  onImported,
}: {
  onImport: (file: File, method: ImportMethod) => Promise<ImportResult>
  onImported: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [method, setMethod] = React.useState<ImportMethod>("normal")

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await onImport(file, method)
      setResult(res)
      onImported()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const fast = method === "normal"

  return (
    <div>
      {/* Parsing-method toggle: fast deterministic vs. slower LLM extraction. */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="radiogroup"
          aria-label="Import parsing method"
          className="inline-flex rounded-lg border border-border bg-muted/20 p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={fast}
            disabled={loading}
            onClick={() => setMethod("normal")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
              fast ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-3.5" /> Fast
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!fast}
            disabled={loading}
            onClick={() => setMethod("agentic")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
              !fast ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="size-3.5" /> Accurate
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {fast
            ? "Fast — instant rule-based parsing. Best for the standard template; can miss irregular files."
            : "Accurate — AI reads the file. Slower, but handles unusual layouts and column names."}
        </p>
      </div>

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
