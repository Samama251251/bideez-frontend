/**
 * Shared types for the bideez backend API (DECIDE / extraction phase).
 * Mirrors docs/frontend-integration.md and the backend contracts.
 */

export type WorkspaceStatus =
  | "intake" // created, awaiting file upload
  | "parsing" // LlamaParse + extraction running
  | "parsed" // legacy: extraction complete (kept for old rows)
  | "analyzing" // matcher + gap analysis running
  | "decision" // analysis done — awaiting human GO/NO-GO (terminal for now)
  | "drafting"
  | "review"
  | "finalized"
  | "failed"
  | "archived"

export type DocumentType = "rfp" | "rfq" | "tender"

/** Processing statuses to keep polling on. */
export const PROCESSING_STATUSES: WorkspaceStatus[] = ["parsing", "analyzing"]

/** Terminal states for the DECIDE flow — stop polling here. */
export const TERMINAL_STATUSES: WorkspaceStatus[] = ["decision", "failed"]

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
  goDecision: GoDecision
}

/** Disqualifying-if-unmet vs scored/nice-to-have. */
export type RequirementSeverity = "mandatory" | "desirable"

/** Domain category. admin is a self-attested checklist; the rest are corpus-matched. */
export type RequirementCategory = "admin" | "product" | "vendor" | "compliance"

export interface RequirementItem {
  id: string
  severity: RequirementSeverity
  category: RequirementCategory
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
  projectOverview: string | null
  requirements: RequirementItem[]
  evaluationCriteria: CriterionItem[]
  questions: QuestionItem[]
}

/* ----------------------------------------------------------------------------
 * Phase 2 — Gap analysis / GO·NO-GO (the DECIDE gate)
 * ------------------------------------------------------------------------- */

export type GoDecision = "pending" | "go" | "no_go"

/** Severity of a requirement gap. `none` = fully matched. */
export type GapSeverity = "none" | "critical" | "scored" | "minor"

export type EvidenceSourceType =
  | "capability"
  | "historical_bid"
  | "knowledge_document"

export interface AnalysisEvidence {
  sourceType: EvidenceSourceType
  sourceId: string
  snippet: string
  confidence: number // 0–100, this evidence's contribution
  sourceAnchor: string | null // sub-doc location, or null
}

export interface AnalysisRequirement {
  id: string
  severity: RequirementSeverity
  category: RequirementCategory
  text: string
  sourceAnchor: string | null
  isMatched: boolean
  matchConfidence: number | null // 0–100, or null if never scored
  gapSeverity: GapSeverity
  evidence: AnalysisEvidence[]
  userOverride?: boolean
  userNote?: string | null
}

export interface OverrideRequirementInput {
  isMatched: boolean
  gapSeverity?: GapSeverity
  note?: string | null
}

export interface OverrideRequirementResponse {
  id: string
  isMatched: boolean
  gapSeverity: GapSeverity
  userOverride: boolean
  userNote: string | null
}

export interface WinProbabilitySubScore {
  score: number
  rationale: string
}

export interface WinProbability {
  overall: number
  budgetAlignment: WinProbabilitySubScore
  competitorPresence: WinProbabilitySubScore
  pastWinRateInDomain: WinProbabilitySubScore
}

export interface ChecklistItem {
  requirementId: string
  text: string
  status: "pass" | "fail"
  gapSeverity: GapSeverity
}

export interface AnalysisChecklist {
  items: ChecklistItem[]
  passCount: number
  failCount: number
}

export interface AnalysisResponse {
  status: WorkspaceStatus
  goDecision: GoDecision // the recorded human decision
  recommendedDecision: GoDecision // the system recommendation
  decisionRationale: string
  winProbability: WinProbability // ⚠ v1 placeholder (pass-rate derived)
  requirements: AnalysisRequirement[]
  checklist: AnalysisChecklist
}

export interface DecisionResponse {
  goDecision: GoDecision
  status?: WorkspaceStatus
}

/* ----------------------------------------------------------------------------
 * Phase 3 — CREATE: Bid proposal sections
 * ------------------------------------------------------------------------- */

export type ProposalSectionType =
  | "cover_letter"
  | "executive_summary"
  | "compliance_matrix"
  | "company_overview"
  | "technical_approach"
  | "past_performance"
  | "team_qualifications"
  | "pricing"
  | "terms"

/** Per-reviewer status on a proposal section. */
export type SectionReviewerStatus = "pending" | "done"

export interface SectionReviewer {
  userId: string
  name: string
  department: string | null
  status: SectionReviewerStatus
  reviewedAt: string | null
}

export interface AssignableMember {
  id: string
  name: string
  department: string | null
  role: "owner" | "employee"
}

export interface ProposalSection {
  id: string
  sectionType: ProposalSectionType
  title: string
  /** AI-generated content (markdown). */
  content: string | null
  /** Human-edited override — used for export when set. */
  humanContent: string | null
  /** True if the section contains a gap placeholder requiring human input. */
  isPlaceholder: boolean
  approved: boolean
  sortOrder: number
  updatedAt: string
  reviewers: SectionReviewer[]
  /** True once every assigned reviewer has marked their pass done. */
  reviewComplete: boolean
}

export interface ProposalResponse {
  workspaceId: string
  status: WorkspaceStatus
  buyerName: string | null
  deadline: string | null
  projectOverview: string | null
  sections: ProposalSection[]
  assignableMembers: AssignableMember[]
}

/**
 * The responding company's real details, used to fill the "Contractor" block
 * of the exported PDF proposal. Sourced from the tenant's company profile
 * (`/api/auth/profile` → `company`) plus the exporting user's email.
 * Any field may be null when the profile hasn't been enriched yet — the
 * exporter omits null fields rather than printing a placeholder.
 */
export interface ProposalVendor {
  name: string | null
  address: string | null
  website: string | null
  email: string | null
}

export interface UpdateSectionResponse {
  id: string
  sectionType: ProposalSectionType
  humanContent: string | null
  approved: boolean
  updatedAt: string
  reviewers: SectionReviewer[]
  reviewComplete: boolean
}

/* ----------------------------------------------------------------------------
 * Phase 3b — SME review: team members, "My Reviews", outcome + lessons
 * ------------------------------------------------------------------------- */

export interface CompanyMember {
  id: string
  name: string
  email: string
  department: string | null
  role: "owner" | "employee"
}

export interface MyReviewTask {
  workspaceId: string
  workspaceTitle: string
  workspaceStatus: WorkspaceStatus
  sectionId: string
  sectionType: ProposalSectionType
  sectionTitle: string
  isPlaceholder: boolean
  myStatus: SectionReviewerStatus
}

export interface ReviewInviteRecipient {
  userId: string
  email: string
  sections: number
  sent: boolean
}

export interface SendReviewsResponse {
  notified: number
  recipients: ReviewInviteRecipient[]
}

export interface RecordOutcomeInput {
  outcome: BidOutcome
  reasons: string
}

export interface WorkingMemory {
  id: string
  companyId: string
  category: string
  content: string
  source: string
  workspaceId: string | null
  createdAt: string
}

/* ----------------------------------------------------------------------------
 * Company Knowledge Base — uploaded evidence docs that feed the matcher
 * ------------------------------------------------------------------------- */

export interface KnowledgeDocument {
  id: string
  title: string
  /** true once parsing finished and the markdown is stored (sourceText !== null). */
  ready: boolean
  createdAt: string
  updatedAt: string
}

/* ----------------------------------------------------------------------------
 * Company Library — capability docs & historical bid data
 * ------------------------------------------------------------------------- */

export type BidOutcome = "win" | "loss"

export interface Capability {
  id: string
  companyId: string
  capRef: string | null
  domain: string
  projectSummary: string
  certification: string | null
  yearCompleted: number | null
  contractValue: string | null
  durationMonths: number | null
  clientType: string | null
  createdAt: string
}

export interface HistoricalBid {
  id: string
  companyId: string
  bidRef: string | null
  client: string | null
  sector: string | null
  budget: string | null
  scorePercent: string | null
  outcome: BidOutcome | null
  responseTimeHours: number | null
  compliancePercent: string | null
  docPages: number | null
  gapsFound: number | null
  bidManager: string | null
  submissionDate: string | null
  createdAt: string
}

export interface ImportResult {
  inserted: number
  skipped: number
  errors: string[]
}

export interface AddCapabilityInput {
  capRef?: string | null
  domain: string
  projectSummary: string
  certification?: string | null
  yearCompleted?: number | null
  contractValue?: string | null
  durationMonths?: number | null
  clientType?: string | null
}

export interface AddBidInput {
  bidRef?: string | null
  client?: string | null
  sector?: string | null
  budget?: string | null
  scorePercent?: number | null
  outcome?: BidOutcome | null
  responseTimeHours?: number | null
  compliancePercent?: number | null
  docPages?: number | null
  gapsFound?: number | null
  bidManager?: string | null
  submissionDate?: string | null
}

/* ----------------------------------------------------------------------------
 * Inbound email / Gmail intake — candidate review queue
 * ------------------------------------------------------------------------- */

export type RfpCandidateStatus = "pending" | "approved" | "rejected" | "duplicate"
export type RfpSource = "gmail" | "manual" | "research_agent"

export interface RfpCandidate {
  id: string
  source: RfpSource
  status: RfpCandidateStatus
  title: string
  buyerName: string | null
  deadline: string | null
  projectOverview: string | null
  /** Numeric string 0–100. Always Number() before comparing. */
  domainFitScore: string
  classificationReason: string | null
  fromAddress: string | null
  subject: string | null
  attachmentFilename: string | null
  promotedWorkspaceId: string | null
  /** Present on research_agent candidates — the original web page. */
  sourceRef?: { url: string; searchTitle: string } | null
  createdAt: string
}

export interface ResearchAgentRunResult {
  queriesRun: number
  resultsScanned: number
  candidatesCreated: number
  duplicatesSkipped: number
}

export interface IntakeAddressResponse {
  address: string
  token: string
}

export interface GmailStatus {
  connected: boolean
  emailAddress?: string
  status?: "active" | "revoked" | "error"
  /** Whether the connection also granted Google Calendar access (deadline reminders).
   *  False for inboxes connected before calendar sync shipped — prompt a reconnect. */
  calendarConnected?: boolean
}

export interface ApproveCandidateResponse {
  workspaceId: string
  /** "parsing" = has doc, go straight to workspace. "intake" = body-only, needs upload. */
  status: WorkspaceStatus
}
