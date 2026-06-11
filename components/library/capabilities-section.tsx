"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAccessToken } from "@/lib/api/browser"
import * as libraryApi from "@/lib/api/library"
import { ApiError } from "@/lib/api/workspaces"
import type { Capability } from "@/lib/api/types"
import { FileImport } from "./file-import"

const EMPTY_FORM = {
  capRef: "",
  domain: "",
  projectSummary: "",
  certification: "",
  yearCompleted: "",
  contractValue: "",
  durationMonths: "",
  clientType: "",
}

export function CapabilitiesSection({ initial }: { initial: Capability[] }) {
  const [items, setItems] = React.useState<Capability[]>(initial)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [adding, setAdding] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  async function refresh() {
    const token = await getAccessToken()
    const { capabilities } = await libraryApi.listCapabilities(token)
    setItems(capabilities)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.domain.trim() || !form.projectSummary.trim()) return
    setAdding(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const { capability } = await libraryApi.addCapability(
        {
          capRef: form.capRef || null,
          domain: form.domain,
          projectSummary: form.projectSummary,
          certification: form.certification || null,
          yearCompleted: form.yearCompleted ? Number(form.yearCompleted) : null,
          contractValue: form.contractValue || null,
          durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
          clientType: form.clientType || null,
        },
        token
      )
      setItems((prev) => [capability, ...prev])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add capability")
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const token = await getAccessToken()
      await libraryApi.deleteCapability(id, token)
      setItems((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <FileImport
        onImport={async (file, method) => {
          const token = await getAccessToken()
          return libraryApi.importCapabilities(file, method, token)
        }}
        onImported={refresh}
      />

      <form onSubmit={handleAdd} className="rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="font-display text-sm font-semibold tracking-tight">Add capability</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="cap-ref">Cap ID</Label>
            <Input
              id="cap-ref"
              value={form.capRef}
              onChange={(e) => setForm((f) => ({ ...f, capRef: e.target.value }))}
              placeholder="CAP-001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-domain">Domain *</Label>
            <Input
              id="cap-domain"
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              placeholder="Cybersecurity"
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cap-summary">Project summary *</Label>
            <Input
              id="cap-summary"
              value={form.projectSummary}
              onChange={(e) => setForm((f) => ({ ...f, projectSummary: e.target.value }))}
              placeholder="Cybersecurity deployment for client"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-cert">Certification</Label>
            <Input
              id="cap-cert"
              value={form.certification}
              onChange={(e) => setForm((f) => ({ ...f, certification: e.target.value }))}
              placeholder="ISO 27001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-year">Year completed</Label>
            <Input
              id="cap-year"
              type="number"
              value={form.yearCompleted}
              onChange={(e) => setForm((f) => ({ ...f, yearCompleted: e.target.value }))}
              placeholder="2023"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-value">Contract value</Label>
            <Input
              id="cap-value"
              value={form.contractValue}
              onChange={(e) => setForm((f) => ({ ...f, contractValue: e.target.value }))}
              placeholder="PKR 15M"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-duration">Duration (months)</Label>
            <Input
              id="cap-duration"
              type="number"
              value={form.durationMonths}
              onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
              placeholder="34"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap-client-type">Client type</Label>
            <Input
              id="cap-client-type"
              value={form.clientType}
              onChange={(e) => setForm((f) => ({ ...f, clientType: e.target.value }))}
              placeholder="International"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-gap">{error}</p>}

        <Button
          type="submit"
          size="sm"
          className="mt-4"
          disabled={adding || !form.domain.trim() || !form.projectSummary.trim()}
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add capability
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cap ID</th>
              <th className="px-3 py-2 font-medium">Domain</th>
              <th className="px-3 py-2 font-medium">Project summary</th>
              <th className="px-3 py-2 font-medium">Certification</th>
              <th className="px-3 py-2 font-medium">Year</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              <th className="px-3 py-2 font-medium">Client type</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  No capabilities yet. Add one or import a file above.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {c.capRef ?? "—"}
                  </td>
                  <td className="px-3 py-2">{c.domain}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={c.projectSummary}>
                    {c.projectSummary}
                  </td>
                  <td className="px-3 py-2">{c.certification ?? "—"}</td>
                  <td className="px-3 py-2">{c.yearCompleted ?? "—"}</td>
                  <td className="px-3 py-2">{c.contractValue ?? "—"}</td>
                  <td className="px-3 py-2">{c.durationMonths ?? "—"}</td>
                  <td className="px-3 py-2">{c.clientType ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id)}
                      aria-label="Delete capability"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
