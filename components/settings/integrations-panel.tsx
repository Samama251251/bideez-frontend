"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Copy, Loader2, Mail, RefreshCw, Unplug, Wifi } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAccessToken } from "@/lib/api/browser"
import {
  getGmailConnectUrl,
  getGmailStatus,
  getIntakeAddress,
} from "@/lib/api/candidates"
import type { GmailStatus, IntakeAddressResponse } from "@/lib/api/types"

type Banner = { kind: "success" | "error"; message: string } | null

export function IntegrationsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [intakeAddress, setIntakeAddress] = React.useState<IntakeAddressResponse | null>(null)
  const [gmailStatus, setGmailStatus] = React.useState<GmailStatus | null>(null)
  const [loadingAddress, setLoadingAddress] = React.useState(true)
  const [loadingGmail, setLoadingGmail] = React.useState(true)
  const [connectingGmail, setConnectingGmail] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [banner, setBanner] = React.useState<Banner>(null)
  const [error, setError] = React.useState<string | null>(null)
  // Incrementing this triggers a silent Gmail status re-fetch (e.g. after OAuth return).
  const [gmailRefreshTick, setGmailRefreshTick] = React.useState(0)

  // On mount: consume ?gmail=success/error → show banner, strip param, trigger status refetch.
  React.useEffect(() => {
    const gmailParam = searchParams.get("gmail")
    if (!gmailParam) return
    Promise.resolve().then(() => {
      if (gmailParam === "success") {
        setBanner({ kind: "success", message: "Gmail connected successfully." })
        setGmailRefreshTick((n) => n + 1)
      } else if (gmailParam === "error") {
        setBanner({ kind: "error", message: "Gmail connection failed. Please try again." })
      }
      const params = new URLSearchParams(searchParams.toString())
      params.delete("gmail")
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch forwarding address once on mount.
  React.useEffect(() => {
    let cancelled = false
    getAccessToken()
      .then((token) => getIntakeAddress(token))
      .then((d) => { if (!cancelled) setIntakeAddress(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAddress(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch Gmail status on mount and whenever gmailRefreshTick increments.
  React.useEffect(() => {
    let cancelled = false
    setLoadingGmail(true)
    getAccessToken()
      .then((token) => getGmailStatus(token))
      .then((d) => { if (!cancelled) setGmailStatus(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingGmail(false) })
    return () => { cancelled = true }
  }, [gmailRefreshTick])

  async function handleCopy() {
    if (!intakeAddress?.address) return
    await navigator.clipboard.writeText(intakeAddress.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleConnectGmail() {
    setConnectingGmail(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const { url } = await getGmailConnectUrl(token)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Gmail connection")
      setConnectingGmail(false)
    }
  }

  const gmailIsConnected = gmailStatus?.connected && gmailStatus.status === "active"
  const gmailNeedsReconnect =
    gmailStatus?.connected && (gmailStatus.status === "revoked" || gmailStatus.status === "error")

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            banner.kind === "success"
              ? "border-go/30 bg-go/10 text-go"
              : "border-gap/30 bg-gap/10 text-gap"
          }`}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="shrink-0 text-current opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Forwarding address */}
      <section className="rounded-2xl border border-border bg-muted/20 p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Mail className="size-4 text-muted-foreground" />
          <h2 className="font-display font-semibold tracking-tight">Forwarding address</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-forward RFP emails to this address (Gmail → Settings → Filters).
        </p>

        {loadingAddress ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : intakeAddress ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
              {intakeAddress.address}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
              {copied ? (
                <><Check className="size-3.5 text-go" /> Copied</>
              ) : (
                <><Copy className="size-3.5" /> Copy</>
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gap">Forwarding address not configured. Contact support.</p>
        )}
      </section>

      {/* Gmail direct connection */}
      <section className="rounded-2xl border border-border bg-muted/20 p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Wifi className="size-4 text-muted-foreground" />
          <h2 className="font-display font-semibold tracking-tight">Connect Gmail</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Gmail inbox and we&apos;ll automatically detect incoming RFPs every
          ~2 minutes — no forwarding filter needed.
        </p>

        {loadingGmail ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : gmailIsConnected ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-go/10 px-3 py-1 text-xs font-medium text-go">
              <span className="size-1.5 rounded-full bg-go" />
              Connected as {gmailStatus!.emailAddress}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGmail}
              disabled={connectingGmail}
              className="gap-1.5 text-muted-foreground"
            >
              <Unplug className="size-3.5" />
              Reconnect
            </Button>
          </div>
        ) : gmailNeedsReconnect ? (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gap/10 px-3 py-1 text-xs font-medium text-gap">
              <span className="size-1.5 rounded-full bg-gap" />
              {gmailStatus!.status === "revoked" ? "Access revoked" : "Connection error"} —{" "}
              {gmailStatus!.emailAddress}
            </span>
            <Button
              size="sm"
              onClick={handleConnectGmail}
              disabled={connectingGmail}
              className="flex gap-1.5"
            >
              {connectingGmail ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Reconnect Gmail
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnectGmail} disabled={connectingGmail} className="gap-2">
            {connectingGmail ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Connect Gmail
          </Button>
        )}

        {error && <p className="mt-3 text-sm text-gap">{error}</p>}

        {!gmailIsConnected && (
          <p className="mt-3 text-xs text-muted-foreground">
            You may see a Google &ldquo;unverified app&rdquo; warning — click{" "}
            <strong>Advanced → Continue</strong> to proceed (expected during beta).
          </p>
        )}
      </section>
    </div>
  )
}
