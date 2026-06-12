import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

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

  // Title isn't on the status payload; resolve it from the list (cheap, cached no-store).
  let title = "Workspace"
  try {
    const { workspaces } = await listWorkspaces(token)
    title = workspaces.find((w) => w.id === id)?.title ?? title
  } catch {
    // fall back to generic title
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/workspaces"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Workspaces
      </Link>

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
