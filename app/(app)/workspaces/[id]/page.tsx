import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getStatus, listWorkspaces } from "@/lib/api/workspaces"
import { ExtractionView } from "@/components/workspaces/extraction-view"

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let status
  try {
    status = await getStatus(id, token)
  } catch {
    notFound()
  }

  let title = "Workspace"
  try {
    const { workspaces } = await listWorkspaces(token)
    title = workspaces.find((w) => w.id === id)?.title ?? title
  } catch {}

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <ExtractionView
        workspaceId={id}
        title={title}
        initialStatus={status.status}
        initialError={status.error}
        initialGoDecision={status.goDecision}
      />
    </div>
  )
}
