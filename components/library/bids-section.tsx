"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAccessToken } from "@/lib/api/browser"
import * as libraryApi from "@/lib/api/library"
import { ApiError } from "@/lib/api/workspaces"
import type { BidOutcome, HistoricalBid } from "@/lib/api/types"
import { FileImport } from "./file-import"

const EMPTY_FORM = {
  bidRef: "",
  client: "",
  sector: "",
  budget: "",
  scorePercent: "",
  outcome: "" as "" | BidOutcome,
  responseTimeHours: "",
  compliancePercent: "",
  docPages: "",
  gapsFound: "",
  bidManager: "",
  submissionDate: "",
}

export function BidsSection({ initial }: { initial: HistoricalBid[] }) {
  const [items, setItems] = React.useState<HistoricalBid[]>(initial)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [adding, setAdding] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  async function refresh() {
    const token = await getAccessToken()
    const { bids } = await libraryApi.listBids(token)
    setItems(bids)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const { bid } = await libraryApi.addBid(
        {
          bidRef: form.bidRef || null,
          client: form.client || null,
          sector: form.sector || null,
          budget: form.budget || null,
          scorePercent: form.scorePercent ? Number(form.scorePercent) : null,
          outcome: form.outcome || null,
          responseTimeHours: form.responseTimeHours ? Number(form.responseTimeHours) : null,
          compliancePercent: form.compliancePercent ? Number(form.compliancePercent) : null,
          docPages: form.docPages ? Number(form.docPages) : null,
          gapsFound: form.gapsFound ? Number(form.gapsFound) : null,
          bidManager: form.bidManager || null,
          submissionDate: form.submissionDate || null,
        },
        token
      )
      setItems((prev) => [bid, ...prev])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add bid")
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const token = await getAccessToken()
      await libraryApi.deleteBid(id, token)
      setItems((prev) => prev.filter((b) => b.id !== id))
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
          return libraryApi.importBids(file, method, token)
        }}
        onImported={refresh}
      />

      <form onSubmit={handleAdd} className="rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="font-display text-sm font-semibold tracking-tight">Add bid</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="bid-ref">Bid ID</Label>
            <Input
              id="bid-ref"
              value={form.bidRef}
              onChange={(e) => setForm((f) => ({ ...f, bidRef: e.target.value }))}
              placeholder="BID-0001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-client">Client</Label>
            <Input
              id="bid-client"
              value={form.client}
              onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
              placeholder="FWO"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-sector">Sector</Label>
            <Input
              id="bid-sector"
              value={form.sector}
              onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
              placeholder="Construction"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-budget">Budget</Label>
            <Input
              id="bid-budget"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              placeholder="PKR 22M"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-score">Score (%)</Label>
            <Input
              id="bid-score"
              type="number"
              value={form.scorePercent}
              onChange={(e) => setForm((f) => ({ ...f, scorePercent: e.target.value }))}
              placeholder="92"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-outcome">Outcome</Label>
            <select
              id="bid-outcome"
              value={form.outcome}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value as "" | BidOutcome }))}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">—</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-response">Response time (hrs)</Label>
            <Input
              id="bid-response"
              type="number"
              value={form.responseTimeHours}
              onChange={(e) => setForm((f) => ({ ...f, responseTimeHours: e.target.value }))}
              placeholder="94"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-compliance">Compliance %</Label>
            <Input
              id="bid-compliance"
              type="number"
              value={form.compliancePercent}
              onChange={(e) => setForm((f) => ({ ...f, compliancePercent: e.target.value }))}
              placeholder="75"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-pages">Doc pages</Label>
            <Input
              id="bid-pages"
              type="number"
              value={form.docPages}
              onChange={(e) => setForm((f) => ({ ...f, docPages: e.target.value }))}
              placeholder="144"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-gaps">Gaps found</Label>
            <Input
              id="bid-gaps"
              type="number"
              value={form.gapsFound}
              onChange={(e) => setForm((f) => ({ ...f, gapsFound: e.target.value }))}
              placeholder="2"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-manager">Bid manager</Label>
            <Input
              id="bid-manager"
              value={form.bidManager}
              onChange={(e) => setForm((f) => ({ ...f, bidManager: e.target.value }))}
              placeholder="Sara Malik"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-date">Submission date</Label>
            <Input
              id="bid-date"
              type="date"
              value={form.submissionDate}
              onChange={(e) => setForm((f) => ({ ...f, submissionDate: e.target.value }))}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-gap">{error}</p>}

        <Button type="submit" size="sm" className="mt-4" disabled={adding}>
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add bid
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Bid ID</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Sector</th>
              <th className="px-3 py-2 font-medium">Budget</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Outcome</th>
              <th className="px-3 py-2 font-medium">Response (hrs)</th>
              <th className="px-3 py-2 font-medium">Compliance</th>
              <th className="px-3 py-2 font-medium">Pages</th>
              <th className="px-3 py-2 font-medium">Gaps</th>
              <th className="px-3 py-2 font-medium">Manager</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">
                  No bid history yet. Add one or import a file above.
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {b.bidRef ?? "—"}
                  </td>
                  <td className="px-3 py-2">{b.client ?? "—"}</td>
                  <td className="px-3 py-2">{b.sector ?? "—"}</td>
                  <td className="px-3 py-2">{b.budget ?? "—"}</td>
                  <td className="px-3 py-2">{b.scorePercent ?? "—"}</td>
                  <td className="px-3 py-2">
                    {b.outcome ? (
                      <span
                        className={
                          b.outcome === "win"
                            ? "inline-flex items-center rounded-full bg-go/10 px-2 py-0.5 text-xs font-medium text-go"
                            : "inline-flex items-center rounded-full bg-gap/10 px-2 py-0.5 text-xs font-medium text-gap"
                        }
                      >
                        {b.outcome === "win" ? "Win" : "Loss"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{b.responseTimeHours ?? "—"}</td>
                  <td className="px-3 py-2">{b.compliancePercent ?? "—"}</td>
                  <td className="px-3 py-2">{b.docPages ?? "—"}</td>
                  <td className="px-3 py-2">{b.gapsFound ?? "—"}</td>
                  <td className="px-3 py-2">{b.bidManager ?? "—"}</td>
                  <td className="px-3 py-2">{b.submissionDate ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                      aria-label="Delete bid"
                    >
                      {deletingId === b.id ? (
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
