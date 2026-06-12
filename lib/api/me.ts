/**
 * Current-user API client — endpoints scoped to the authenticated member
 * rather than a workspace.
 */
import { request } from "./request"
import type { MyReviewTask } from "./types"

/** Proposal sections assigned to the current user across all their workspaces. */
export function getReviewTasks(token?: string) {
  return request<{ tasks: MyReviewTask[] }>("/api/me/review-tasks", {}, token)
}
