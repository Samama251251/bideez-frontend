import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Inbox } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { ReviewQueue } from "@/components/candidates/review-queue"

export default async function ReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Inbox className="size-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Review queue</h1>
        </div>
        <Link
          href="/settings"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Configure sources →
        </Link>
      </div>

      <ReviewQueue />
    </div>
  )
}
