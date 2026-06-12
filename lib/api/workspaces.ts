/**
 * Backend API client for workspace / extraction endpoints.
 *
 * Framework-agnostic: every function takes an optional bearer `token` so it
 * works from both Server Components (server session token) and Client
 * Components (browser session token via lib/api/browser.ts). `companyId` is
 * NEVER sent — the backend derives it from the token.
 */
import type {
  AnalysisResponse,
  CreateWorkspaceResponse,
  DecisionResponse,
  DocumentType,
  GoDecision,
  OverrideRequirementInput,
  OverrideRequirementResponse,
  RecordOutcomeInput,
  RequirementsResponse,
  SectionReviewer,
  SendReviewsResponse,
  StatusResponse,
  UploadUrlResponse,
  WorkingMemory,
  WorkspaceStatus,
  WorkspaceSummary,
} from "./types"

import { ApiError, request } from "./request"

export { ApiError }

export function listWorkspaces(token?: string) {
  return request<{ workspaces: WorkspaceSummary[] }>("/api/workspaces", {}, token)
}

export function createWorkspace(
  body: { title: string; documentType?: DocumentType },
  token?: string
) {
  return request<CreateWorkspaceResponse>(
    "/api/workspaces",
    { method: "POST", body: JSON.stringify(body) },
    token
  )
}

export function getUploadUrl(workspaceId: string, filename: string, token?: string) {
  return request<UploadUrlResponse>(
    `/api/workspaces/${workspaceId}/upload-url`,
    { method: "POST", body: JSON.stringify({ filename }) },
    token
  )
}

export function confirmUploaded(workspaceId: string, storagePath: string, token?: string) {
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/uploaded`,
    { method: "POST", body: JSON.stringify({ storagePath }) },
    token
  )
}

export function getStatus(workspaceId: string, token?: string) {
  return request<StatusResponse>(`/api/workspaces/${workspaceId}/status`, {}, token)
}

export function getRequirements(workspaceId: string, token?: string) {
  return request<RequirementsResponse>(
    `/api/workspaces/${workspaceId}/requirements`,
    {},
    token
  )
}

/** Phase 2 — gap analysis + recommendation. Available once status === "decision". */
export function getAnalysis(workspaceId: string, token?: string) {
  return request<AnalysisResponse>(
    `/api/workspaces/${workspaceId}/analysis`,
    {},
    token
  )
}

/** Record the human GO/NO-GO decision. Only valid while status === "decision". */
export function recordDecision(
  workspaceId: string,
  decision: Exclude<GoDecision, "pending">,
  token?: string
) {
  return request<DecisionResponse>(
    `/api/workspaces/${workspaceId}/decision`,
    { method: "POST", body: JSON.stringify({ decision }) },
    token
  )
}

/** Manually override the LLM's verdict on a single requirement. */
export function overrideRequirement(
  workspaceId: string,
  requirementId: string,
  body: OverrideRequirementInput,
  token?: string
) {
  return request<OverrideRequirementResponse>(
    `/api/workspaces/${workspaceId}/requirements/${requirementId}/override`,
    { method: "PATCH", body: JSON.stringify(body) },
    token
  )
}

export function retryWorkspace(workspaceId: string, token?: string) {
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/retry`,
    { method: "POST" },
    token
  )
}

/* -------------------------------------------------------------------------
 * Phase 3 — CREATE: Bid proposal endpoints
 * ------------------------------------------------------------------------- */

/** Fetch all proposal sections. Available once status === "review" | "finalized". */
export function getProposal(workspaceId: string, token?: string) {
  return request<import("./types").ProposalResponse>(
    `/api/workspaces/${workspaceId}/proposal`,
    {},
    token
  )
}

/** Save a human edit, approval, or reviewer-done to a single section. */
export function updateProposalSection(
  workspaceId: string,
  sectionId: string,
  body: { humanContent?: string | null; approved?: boolean; markDone?: boolean; baseUpdatedAt?: string },
  token?: string
) {
  return request<import("./types").UpdateSectionResponse>(
    `/api/workspaces/${workspaceId}/proposal/sections/${sectionId}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token
  )
}

/** Owner-only: override the reviewer set for a section. */
export function setSectionReviewers(
  workspaceId: string,
  sectionId: string,
  userIds: string[],
  token?: string
) {
  return request<{ reviewers: SectionReviewer[] }>(
    `/api/workspaces/${workspaceId}/proposal/sections/${sectionId}/reviewers`,
    { method: "PATCH", body: JSON.stringify({ userIds }) },
    token
  )
}

/** Owner-only: email every assigned reviewer a summary of their sections. */
export function sendReviews(workspaceId: string, token?: string) {
  return request<SendReviewsResponse>(
    `/api/workspaces/${workspaceId}/proposal/send-reviews`,
    { method: "POST" },
    token
  )
}

/** Mark the proposal as finalized. Requires status === "review". */
export function finalizeProposal(workspaceId: string, token?: string) {
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/proposal/finalize`,
    { method: "POST" },
    token
  )
}

/** Owner-only: record the win/loss outcome of a finalized bid. */
export function recordOutcome(workspaceId: string, body: RecordOutcomeInput, token?: string) {
  return request<{ outcome: RecordOutcomeInput["outcome"] }>(
    `/api/workspaces/${workspaceId}/outcome`,
    { method: "POST", body: JSON.stringify(body) },
    token
  )
}

/** The learnings (working memories) produced by this workspace. */
export function getLearnings(workspaceId: string, token?: string) {
  return request<{ learnings: WorkingMemory[] }>(
    `/api/workspaces/${workspaceId}/learnings`,
    {},
    token
  )
}

/** Re-run a failed CREATE phase (draft generation). Requires goDecision === "go". */
export function retryCreateWorkspace(workspaceId: string, confirm?: boolean, token?: string) {
  const qs = confirm ? "?confirm=true" : ""
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/retry-create${qs}`,
    { method: "POST" },
    token
  )
}

