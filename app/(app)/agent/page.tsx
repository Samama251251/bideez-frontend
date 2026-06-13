import { AgentChat } from "@/components/chat/agent-chat"

export default function AgentPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="font-display text-xl font-semibold tracking-tight">Agent</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ask the Bideez agent to check status, decide, or draft a proposal.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <AgentChat />
      </div>
    </div>
  )
}
