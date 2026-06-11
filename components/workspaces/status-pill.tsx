import { cn } from "@/lib/utils"
import type { WorkspaceStatus } from "@/lib/api/types"

const LABELS: Record<WorkspaceStatus, string> = {
  intake: "Awaiting file",
  parsing: "Extracting",
  parsed: "Extracted",
  analyzing: "Analyzing",
  decision: "Ready to decide",
  drafting: "Drafting",
  review: "Review",
  finalized: "Finalized",
  failed: "Failed",
  archived: "Archived",
}

/** Maps each status onto the project's semantic status tokens. */
function toneClass(status: WorkspaceStatus): string {
  switch (status) {
    case "parsed":
    case "decision":
    case "finalized":
      return "bg-go/10 text-go"
    case "failed":
      return "bg-gap/10 text-gap"
    case "parsing":
    case "analyzing":
    case "drafting":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function StatusPill({ status }: { status: WorkspaceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass(status)
      )}
    >
      {LABELS[status]}
    </span>
  )
}
