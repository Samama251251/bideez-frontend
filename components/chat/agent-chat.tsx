"use client"

import * as React from "react"
import { Bot, ArrowUp, Loader2, CircleCheck, CircleX, Sparkles, ListChecks, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"
import { getAccessToken } from "@/lib/api/browser"
import { streamChat, type ChatMessage, type DecisionRequestPayload } from "@/lib/api/chat"
import { recordDecision } from "@/lib/api/workspaces"

/**
 * Bideez Agent — full-page chat. Talks to POST /api/chat, which runs the
 * Copilot agent (tools wrap the same services the rest of the app uses), so
 * instructions like "create a proposal from this place" drive real actions
 * (approve candidate -> DECIDE -> GO/NO-GO -> CREATE) rather than just
 * answering.
 *
 * GO/NO-GO is a human step: when the agent proposes a decision, it's rendered
 * as a confirmation card. The actual decision is only recorded when the user
 * clicks Confirm GO / Confirm NO-GO, via the existing decision endpoint.
 */

type DisplayItem =
  | { kind: "message"; role: "user" | "assistant"; content: string }
  | { kind: "decision"; payload: DecisionRequestPayload; resolution: "go" | "no_go" | null }

const SUGGESTIONS = [
  { icon: ListChecks, label: "Workspace status", prompt: "What's the status of my workspaces?" },
  { icon: Sparkles, label: "Draft a proposal", prompt: "Create a proposal from the latest candidate" },
  { icon: Link2, label: "Start from a link", prompt: "Paste a link to an RFP/tender to start a new workspace" },
]

function AgentAvatar({ active = false }: { active?: boolean }) {
  return (
    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
      <span
        aria-hidden
        className={cn("agent-ring absolute inset-0 rounded-full", active && "agent-ring-active")}
      />
      <span aria-hidden className="absolute inset-[2px] rounded-full bg-background" />
      <Bot className="relative z-10 size-4 text-primary" />
    </div>
  )
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1.5 py-1.5 text-muted-foreground">
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current" />
    </span>
  )
}

export function AgentChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [items, setItems] = React.useState<DisplayItem[]>([])
  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [decidingId, setDecidingId] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [items, isStreaming])

  async function handleSend(text = input.trim()) {
    if (!text || isStreaming) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setItems((prev) => [...prev, { kind: "message", role: "user", content: text }, { kind: "message", role: "assistant", content: "" }])
    setInput("")
    setIsStreaming(true)
    setError(null)

    try {
      const token = await getAccessToken()
      let assistantText = ""
      await streamChat(nextMessages, token, (event) => {
        if (event.type === "token") {
          assistantText += event.text
          setItems((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { kind: "message", role: "assistant", content: assistantText }
            return updated
          })
        } else if (event.type === "decision_request") {
          setItems((prev) => [...prev, { kind: "decision", payload: event.payload, resolution: null }])
        } else if (event.type === "error") {
          setError(event.message)
        }
      })
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setItems((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleConfirmDecision(index: number, decision: "go" | "no_go") {
    const item = items[index]
    if (item.kind !== "decision") return
    setDecidingId(item.payload.workspaceId)
    setError(null)
    try {
      const token = await getAccessToken()
      await recordDecision(item.payload.workspaceId, decision, token)
      setItems((prev) => {
        const updated = [...prev]
        updated[index] = { ...item, resolution: decision }
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision")
    } finally {
      setDecidingId(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const composer = (
    <div className="flex w-full items-end gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message the Bideez Agent..."
        rows={1}
        className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
        disabled={isStreaming}
      />
      <Button
        size="icon"
        className="rounded-full"
        onClick={() => void handleSend()}
        disabled={isStreaming || !input.trim()}
      >
        {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
      </Button>
    </div>
  )

  const suggestionPills = (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
        <button
          key={label}
          type="button"
          onClick={() => void handleSend(prompt)}
          className="glass-subtle flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          <Icon className="size-4 shrink-0 text-primary" />
          <span className="text-foreground/90">{label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 size-80 rounded-full bg-go/10 blur-3xl" />
      </div>

      {items.length === 0 ? (
        /* Empty state — centered composer hero, inspired by "How can I help?" layouts */
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
          <div className="animate-rise flex w-full max-w-2xl flex-col items-center gap-6">
            <h1 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              How can I help?
            </h1>
            <div className="w-full">{composer}</div>
            {suggestionPills}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
          {items.map((item, i) => {
            if (item.kind === "message") {
              if (item.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="min-w-0 max-w-[85%] overflow-hidden rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                      <Markdown className="text-primary-foreground [&_a]:text-primary-foreground [&_a]:hover:text-primary-foreground/80">{item.content}</Markdown>
                    </div>
                  </div>
                )
              }

              const isThinking = !item.content && isStreaming && i === items.length - 1
              return (
                <div key={i} className="flex items-start gap-3">
                  <AgentAvatar active={isThinking} />
                  <div className="glass-subtle min-w-0 max-w-[85%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm">
                    {item.content ? (
                      <Markdown>{item.content}</Markdown>
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                </div>
              )
            }

            const { payload, resolution } = item
            const isDeciding = decidingId === payload.workspaceId
            return (
              <div key={i} className="flex items-start gap-3">
                <AgentAvatar />
                <div className="glass max-w-[85%] min-w-0 flex-1 rounded-2xl rounded-tl-md p-4 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    GO / NO-GO decision
                  </p>
                  <p className="mt-1.5">
                    Recommendation:{" "}
                    <span className="font-semibold">{payload.recommendedDecision ?? "unknown"}</span>
                    {payload.winProbability !== null && (
                      <span className="text-muted-foreground"> · {Math.round(payload.winProbability)}% win probability</span>
                    )}
                  </p>
                  {payload.decisionRationale && (
                    <p className="mt-1.5 text-muted-foreground">{payload.decisionRationale}</p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Checklist: {payload.checklist.passCount} pass / {payload.checklist.failCount} fail
                  </p>

                  {resolution ? (
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                      {resolution === "go" ? (
                        <CircleCheck className="size-4 text-go" />
                      ) : (
                        <CircleX className="size-4 text-destructive" />
                      )}
                      {resolution === "go" ? "Marked as GO" : "Marked as NO-GO"}
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isDeciding}
                        onClick={() => void handleConfirmDecision(i, "go")}
                      >
                        {isDeciding ? <Loader2 className="size-4 animate-spin" /> : "Confirm GO"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isDeciding}
                        onClick={() => void handleConfirmDecision(i, "no_go")}
                      >
                        {isDeciding ? <Loader2 className="size-4 animate-spin" /> : "Confirm NO-GO"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="border-t border-border/60 bg-background/70 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-3xl">{composer}</div>
        </div>
      )}
    </div>
  )
}
