import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { listKnowledge } from "@/lib/api/knowledge"
import type { KnowledgeDocument } from "@/lib/api/types"
import { KnowledgeManager } from "@/components/knowledge/knowledge-manager"

export default async function KnowledgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let documents: KnowledgeDocument[] = []
  try {
    const res = await listKnowledge(token)
    documents = res.documents
  } catch {
    // Backend unreachable / empty — render empty state.
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-2 flex items-center gap-2.5">
        <BookOpen className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Knowledge base</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Upload policies, certifications and past proposals. Each document is parsed and
        becomes evidence the matcher cites when it scores your RFP requirements.
      </p>

      <KnowledgeManager initialDocuments={documents} />
    </div>
  )
}
