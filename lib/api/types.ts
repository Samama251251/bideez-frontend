/**
 * Shared types for the bideez backend API (DECIDE / extraction phase).
 * Mirrors docs/frontend-integration.md and the backend contracts.
 */

export type WorkspaceStatus =
  | "intake" // created, awaiting file upload
  | "parsing" // LlamaParse + extraction running
  | "parsed" // extraction complete (terminal for now)
  | "analyzing" // (later) gap analysis
  | "decision" // (later) awaiting GO/NO-GO
  | "drafting"
  | "review"
  | "finalized"
  | "failed"
  | "archived"

export type DocumentType = "rfp" | "rfq" | "tender"

/** Terminal states for the extraction flow — stop polling here. */
export const TERMINAL_STATUSES: WorkspaceStatus[] = ["parsed", "failed"]

export interface WorkspaceSummary {
  id: string
  title: string
  status: WorkspaceStatus
  documentType: DocumentType
  buyerName: string | null
  deadline: string | null
  storageObjectPath: string | null
  error: string | null
  createdAt: string
}

export interface CreateWorkspaceResponse {
  workspaceId: string
  status: WorkspaceStatus
}

export interface UploadUrlResponse {
  uploadUrl: string
  token: string
  storagePath: string
}

export interface StatusResponse {
  status: WorkspaceStatus
  error: string | null
}

export interface RequirementItem {
  id: string
  kind: "mandatory" | "compliance"
  text: string
  sourceAnchor: string | null
}

export interface CriterionItem {
  id: string
  criterion: string
  weight: string | null
  sourceAnchor: string | null
}

export interface QuestionItem {
  id: string
  question: string
  sourceAnchor: string | null
}

export interface RequirementsResponse {
  sourceText: string | null
  deadline: string | null
  buyerName: string | null
  requirements: RequirementItem[]
  evaluationCriteria: CriterionItem[]
  questions: QuestionItem[]
}
