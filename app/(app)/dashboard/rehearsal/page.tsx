"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Vapi from "@vapi-ai/web"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Volume2,
  Shield,
  Target,
  ArrowLeft,
  X,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface RehearsalQuestion {
  id: string
  rank: number
  text: string
  source: "gap" | "eval_criteria" | "low_confidence"
  sourceId: string
  followUpProbes: string[]
}

interface AnswerScore {
  questionId: string
  score: number
  clarity: number
  directness: number
  evidenceCited: number
  compliance: number
  feedback: string
  modelAnswer: string
  needsRehearsal: boolean
}

interface RehearsalScores {
  answers: AnswerScore[]
  overallReadiness: number
  strengths: string[]
  weaknesses: string[]
  recommendedFocus: string[]
}

interface SessionData {
  sessionId: string
  questions: RehearsalQuestion[]
  vapiConfig: any
}

interface SessionReport {
  sessionId: string
  overallReadiness: string
  scores: RehearsalScores
  coachingNotes: string
  callDurationSecs: number
  questions: RehearsalQuestion[]
}

type CallStatus =
  | "idle"
  | "loading"
  | "connecting"
  | "active"
  | "ending"
  | "scoring"
  | "scored"
  | "error"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ""

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function RehearsalPage() {
  /* -- State ------------------------------------------------------------ */
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [isMuted, setIsMuted] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)
  const [report, setReport] = useState<SessionReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<
    { role: string; text: string }[]
  >([])
  const transcriptRef = useRef<{ role: string; text: string }[]>([])

  const vapiRef = useRef<Vapi | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  /* -- URL params ------------------------------------------------------- */
  const searchParams = useSearchParams()
  const router = useRouter()
  const paramWorkspaceId = searchParams.get("workspaceId")
  const paramCompanyId = searchParams.get("companyId")
  const paramTitle = searchParams.get("title")

  const hasParams = !!paramWorkspaceId && !!paramCompanyId

  const [workspaceId, setWorkspaceId] = useState(paramWorkspaceId ?? "")
  const [companyId, setCompanyId] = useState(paramCompanyId ?? "")

  /* -- Redirect if no params -------------------------------------------- */
  useEffect(() => {
    if (!hasParams) {
      router.replace("/dashboard")
    }
  }, [hasParams, router])

  /* -- Cleanup ---------------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  /* -- Start rehearsal --------------------------------------------------- */
  const startRehearsal = useCallback(async () => {
    setError(null)
    setCallStatus("loading")
    setTranscript([])
    transcriptRef.current = []
    setReport(null)

    try {
      // 1. Call our backend to generate questions + create Vapi call
      const res = await fetch(`${API_BASE}/api/rehearsal/${workspaceId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to start rehearsal")
      }

      const data: SessionData = await res.json()
      setSession(data)
      setCallStatus("connecting")

      // 2. Initialize Vapi web SDK and join the call
      if (!VAPI_PUBLIC_KEY) {
        throw new Error(
          "NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Add it to your .env file."
        )
      }

      const vapi = new Vapi(VAPI_PUBLIC_KEY)
      vapiRef.current = vapi

      // Event listeners
      vapi.on("call-start", () => {
        setCallStatus("active")
      })

      vapi.on("call-end", async () => {
        setCallStatus("scoring")
        
        // If we collected a transcript, we can trigger the manual score endpoint.
        // This is needed because Vapi webhooks cannot reach localhost.
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocalhost) {
          const formattedTranscript = transcriptRef.current
            .map((t) => `${t.role === "user" ? "User" : "Buyer"}: ${t.text}`)
            .join("\n") || "Call ended without transcript.";
            
          try {
            await fetch(`${API_BASE}/api/rehearsal/sessions/${data.sessionId}/score`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: formattedTranscript }),
            })
          } catch (err) {
            console.error("Manual scoring trigger failed", err)
          }
        }

        // Start polling for scores
        startPollingForScores(data.sessionId)
      })

      vapi.on("speech-start", () => {
        setIsSpeaking(true)
      })

      vapi.on("speech-end", () => {
        setIsSpeaking(false)
      })

      vapi.on("volume-level", (level: number) => {
        setVolumeLevel(level)
      })

      vapi.on("message", (msg: any) => {
        if (msg.type === "transcript") {
          if (msg.transcriptType === "final") {
            const newItem = { role: msg.role, text: msg.transcript }
            setTranscript((prev) => [...prev, newItem])
            transcriptRef.current.push(newItem)
          }
        }
      })

      vapi.on("error", (err: any) => {
        // Ignore "Meeting has ended due to ejection" errors (Vapi uses Daily.co ejection to end calls)
        const msg = err?.error?.errorMsg || err?.errorMsg || err?.message?.msg || err?.message || "";
        if (typeof msg === 'string' && msg.includes("Meeting has ended")) {
          return;
        }

        console.error("Vapi error:", err)
        setError(typeof msg === 'string' && msg ? msg : "Voice call error")
        setCallStatus("error")
      })

      // Join the web call with the assistant config
      await vapi.start(data.vapiConfig)
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (typeof errMsg === 'string' && errMsg.includes("Meeting has ended")) {
        return;
      }
      console.error("Start rehearsal error:", err)
      setError(errMsg)
      setCallStatus("error")
    }
  }, [workspaceId, companyId])

  /* -- Stop call -------------------------------------------------------- */
  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      setCallStatus("ending")
      vapiRef.current.stop()
    }
  }, [])

  /* -- Toggle mute ------------------------------------------------------ */
  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted
      vapiRef.current.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  /* -- Poll for scores -------------------------------------------------- */
  const startPollingForScores = useCallback((sessionId: string) => {
    let attempts = 0
    const maxAttempts = 30 // 30 * 3s = 90s max

    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(
          `${API_BASE}/api/rehearsal/sessions/${sessionId}/report`
        )

        if (res.ok) {
          const data = await res.json()
          setReport(data)
          setCallStatus("scored")
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current)
          setError("Scoring timed out. The report may still appear shortly.")
          setCallStatus("error")
        }
      } catch {
        // Keep polling
      }
    }, 3000)
  }, [])

  /* -- Score color helper ----------------------------------------------- */
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-go"
    if (score >= 60) return "text-scored"
    return "text-gap"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "border-go/30 bg-go/5"
    if (score >= 60) return "border-scored/30 bg-scored/5"
    return "border-gap/30 bg-gap/5"
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "gap":
        return (
          <span className="rounded-full bg-gap/15 px-2 py-0.5 font-mono text-[10px] text-gap">
            GAP
          </span>
        )
      case "eval_criteria":
        return (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
            CRITERIA
          </span>
        )
      case "low_confidence":
        return (
          <span className="rounded-full bg-scored/15 px-2 py-0.5 font-mono text-[10px] text-scored">
            LOW CONFIDENCE
          </span>
        )
      default:
        return null
    }
  }

  /* ====================================================================== */
  /*  RENDER                                                                 */
  /* ====================================================================== */

  return (
    <div className="relative flex min-h-svh flex-col px-4 pb-20">
      {/* ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[6%] size-[44rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute right-[8%] bottom-[-12%] size-[40rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl py-12 animate-rise">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-2">
          {hasParams ? (
            <a
              href={`/workspaces/${workspaceId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
            >
              <ArrowLeft className="size-4" />
              Back to Workspace
            </a>
          ) : (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </a>
          )}
          <div className="flex items-center gap-3 mt-4">
            <span className="font-mono text-xs text-muted-foreground">
              Phase 04 · Defend
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {hasParams && paramTitle
              ? `Rehearsal: ${paramTitle}`
              : "Oral Interview Rehearsal"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Practice your defense against the buyer panel&apos;s toughest questions.
          </p>
        </div>

        {/* ============================================================== */}
        {/*  IDLE STATE — Setup form                                       */}
        {/* ============================================================== */}
        {callStatus === "idle" && hasParams && (
          <div className="glass rounded-3xl p-8 max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                <Shield className="size-4.5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl font-medium">Ready to Rehearse</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              The AI buyer panel will call you and ask{" "}
              <span className="font-medium text-foreground">6–8 hard-hitting questions</span>{" "}
              drawn from your proposal&apos;s gaps, evaluation criteria, and weak sections.
              After the call, each answer is scored on clarity, directness, evidence,
              and compliance.
            </p>
            <Button
              onClick={startRehearsal}
              disabled={!workspaceId || !companyId}
              size="lg"
              className="w-full h-12 text-[15px]"
            >
              <Phone className="mr-2 h-4 w-4" />
              Start Rehearsal Call
            </Button>
          </div>
        )}

        {callStatus === "idle" && !hasParams && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            {/* Setup card */}
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                  <Shield className="size-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-xl font-medium">Configure Rehearsal</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Workspace ID
                  </label>
                  <input
                    type="text"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    placeholder="Paste your workspace ID here"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Company ID
                  </label>
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Paste your company ID here"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  onClick={startRehearsal}
                  disabled={!workspaceId || !companyId}
                  size="lg"
                  className="w-full h-12 text-[15px]"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Start Rehearsal Call
                </Button>
              </div>
            </div>

            {/* Info card */}
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                  <Target className="size-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-xl font-medium">How It Works</h3>
              </div>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Questions Generated",
                    desc: "The system reads your proposal&apos;s gaps, evaluation criteria, and low-confidence sections to generate 6-8 hard-hitting buyer questions.",
                  },
                  {
                    step: "2",
                    title: "Voice Call Starts",
                    desc: "A realistic buyer panel member calls you and asks questions one at a time, probing weak answers.",
                  },
                  {
                    step: "3",
                    title: "Scored & Coached",
                    desc: "After the call, each answer is scored on clarity, directness, evidence, and compliance. You get coaching notes and model answers.",
                  },
                ].map((item, i) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] text-primary mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Run the seed fixture first to create a
                  test workspace: <br/>
                  <code className="rounded bg-background/50 border border-border px-1.5 py-0.5 text-[11px] mt-2 inline-block">
                    npx ts-node src/fixtures/seed-rehearsal-fixture.ts
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/*  LOADING STATE                                                  */}
        {/* ============================================================== */}
        {callStatus === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-6 text-xl font-display font-medium">
              Generating interview questions...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Analyzing gaps, evaluation criteria, and weak sections
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/*  CONNECTING STATE                                               */}
        {/* ============================================================== */}
        {callStatus === "connecting" && (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-go/20" />
              <div className="relative rounded-full border border-go/30 bg-go/10 p-5">
                <Phone className="h-8 w-8 text-go" />
              </div>
            </div>
            <p className="mt-6 text-xl font-display font-medium">
              Connecting to buyer panel...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {session?.questions.length} questions prepared
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/*  ACTIVE CALL                                                    */}
        {/* ============================================================== */}
        {(callStatus === "active" || callStatus === "ending") && (
          <div className="flex justify-center">
            {/* Call controls */}
            <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col w-full max-w-lg">
              {/* Voice visualizer */}
              <div className="mb-8 flex flex-col items-center flex-1 justify-center">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-primary/20 transition-transform duration-150"
                    style={{
                      transform: `scale(${1 + volumeLevel * 0.5})`,
                      opacity: isSpeaking ? 0.6 : 0.2,
                    }}
                  />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Volume2 className="h-10 w-10" />
                  </div>
                </div>
                <p className="mt-6 font-display font-medium text-lg">
                  {isSpeaking
                    ? "Buyer is speaking..."
                    : "Listening to your response"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-go" />
                  <span className="text-xs font-mono tracking-wide text-go uppercase">
                    Call active
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={toggleMute}
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-all border ${
                    isMuted
                      ? "border-gap/40 bg-gap/10 text-gap hover:bg-gap/20"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={stopCall}
                  disabled={callStatus === "ending"}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gap text-gap-foreground transition-all hover:bg-gap/90 disabled:opacity-50"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/*  SCORING STATE                                                  */}
        {/* ============================================================== */}
        {callStatus === "scoring" && (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
              <div className="relative rounded-full border border-primary/30 bg-primary/10 p-5">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="mt-6 text-xl font-display font-medium">
              Scoring your performance...
            </p>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm text-balance">
              Evaluating clarity, directness, evidence, and compliance for each
              answer against the criteria.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/*  SCORED — Report                                                */}
        {/* ============================================================== */}
        {callStatus === "scored" && report && (
          <div className="space-y-6">
            {/* Overall score banner */}
            <div className="glass overflow-hidden rounded-3xl p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                <div>
                  <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">
                    Overall Readiness
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span
                      className={`text-6xl font-display font-bold tracking-tight ${getScoreColor(Number(report.overallReadiness))}`}
                    >
                      {report.overallReadiness}
                    </span>
                    <span className="text-2xl text-muted-foreground/60 font-mono">/100</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
                    {Number(report.overallReadiness) >= 80
                      ? "Strong performance — ready for the real call. Your defense aligns well with the stated criteria and mitigates the gaps."
                      : Number(report.overallReadiness) >= 60
                        ? "Decent, but several areas need improvement. Focus on strengthening the gaps highlighted below."
                        : "Significant gaps — rehearse again before the real call. Review the model answers to see how to pivot the conversation."}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-6 sm:gap-4 sm:text-right w-full sm:w-auto p-6 sm:p-0 rounded-2xl border sm:border-none border-border/60 bg-muted/20 sm:bg-transparent">
                  <div>
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Call Duration</p>
                    <p className="mt-1 font-display text-2xl font-medium">
                      {report.callDurationSecs
                        ? `${Math.floor(report.callDurationSecs / 60)}:${String(report.callDurationSecs % 60).padStart(2, "0")}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Questions Asked</p>
                    <p className="mt-1 font-display text-2xl font-medium">
                      {report.scores.answers.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths / Weaknesses / Focus */}
            <div className="grid gap-5 md:grid-cols-3">
              <div className="glass rounded-3xl p-6 border-go/20 bg-go/5">
                <p className="mb-4 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wide text-go uppercase">
                  <CheckCircle2 className="size-3.5" />
                  Strengths
                </p>
                <ul className="space-y-2.5">
                  {report.scores.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                    >
                      <ChevronRight className="mt-1 size-3.5 shrink-0 text-go/70" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-3xl p-6 border-gap/20 bg-gap/5">
                <p className="mb-4 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wide text-gap uppercase">
                  <AlertTriangle className="size-3.5" />
                  Weaknesses
                </p>
                <ul className="space-y-2.5">
                  {report.scores.weaknesses.map((w, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                    >
                      <ChevronRight className="mt-1 size-3.5 shrink-0 text-gap/70" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-3xl p-6 border-primary/20 bg-primary/5">
                <p className="mb-4 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wide text-primary uppercase">
                  <Target className="size-3.5" />
                  Focus Areas
                </p>
                <ul className="space-y-2.5">
                  {report.scores.recommendedFocus.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                    >
                      <ChevronRight className="mt-1 size-3.5 shrink-0 text-primary/70" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Per-question scores */}
            <div className="glass rounded-3xl p-8">
              <h3 className="font-display text-xl font-medium mb-6">
                Question-by-Question Breakdown
              </h3>
              <div className="space-y-5">
                {report.scores.answers.map((answer) => {
                  const question = report.questions?.find(
                    (q) => q.id === answer.questionId
                  )
                  return (
                    <div
                      key={answer.questionId}
                      className={`glass-subtle rounded-2xl p-6 border-l-4 ${
                        answer.score >= 80 ? "border-l-go" : answer.score >= 60 ? "border-l-scored" : "border-l-gap"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-2 flex-wrap">
                            <span className="flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">
                              {question?.rank ?? "?"}
                            </span>
                            {question && getSourceBadge(question.source)}
                            {answer.needsRehearsal && (
                              <span className="rounded-full bg-gap/15 px-2 py-0.5 font-mono text-[10px] text-gap">
                                NEEDS REHEARSAL
                              </span>
                            )}
                          </div>
                          <p className="text-base font-medium text-foreground">
                            {question?.text ?? answer.questionId}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 bg-background/50 p-4 rounded-xl border border-border/50">
                          <div className="text-center">
                            <span
                              className={`font-display text-3xl font-bold ${getScoreColor(answer.score)}`}
                            >
                              {answer.score}
                            </span>
                          </div>
                          
                          {/* Score dimensions */}
                          <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-l border-border/50 pl-6">
                            {[
                              { label: "Clarity", value: answer.clarity },
                              { label: "Directness", value: answer.directness },
                              { label: "Evidence", value: answer.evidenceCited },
                              { label: "Compliance", value: answer.compliance },
                            ].map((dim) => (
                              <div key={dim.label} className="flex justify-between items-center gap-3">
                                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                                  {dim.label}
                                </p>
                                <p
                                  className={`font-mono text-sm font-medium ${getScoreColor(dim.value)}`}
                                >
                                  {dim.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Feedback + Model answer */}
                      <div className="mt-6 grid md:grid-cols-2 gap-5 border-t border-border/60 pt-5">
                        <div className="bg-background/40 rounded-xl p-4 border border-border/40">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
                            <MessageSquare className="size-3" /> Feedback
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {answer.feedback}
                          </p>
                        </div>
                        <div className="bg-primary/[0.04] rounded-xl p-4 border border-primary/20">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5 mb-2">
                            <Shield className="size-3" /> Model Answer
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {answer.modelAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Post-scoring actions */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <a
                href={`/workspaces/${workspaceId}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to Workspace
              </a>
              <Button
                onClick={() => {
                  setCallStatus("idle")
                  setSession(null)
                  setReport(null)
                  setTranscript([])
                  setError(null)
                }}
                size="lg"
                className="h-12 px-8 text-[15px]"
              >
                <Phone className="mr-2 h-4 w-4" />
                Rehearse Again
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/*  ERROR STATE                                                    */}
        {/* ============================================================== */}
        {callStatus === "error" && (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-gap/30 bg-gap/10 text-gap">
              <AlertTriangle className="size-6" />
            </div>
            <p className="mt-6 font-display text-xl font-medium">
              Something went wrong
            </p>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              {error}
            </p>
            <Button
              onClick={() => {
                setCallStatus("idle")
                setError(null)
              }}
              variant="outline"
              className="mt-8"
            >
              Try Again
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
