import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { ReviewQueue } from "@/components/candidates/review-queue"

export default async function ReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Opportunities</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review and approve RFPs from email intake or web discovery.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Configure sources →
        </Link>
      </div>

      <ReviewQueue />
    </div>
  )
}
