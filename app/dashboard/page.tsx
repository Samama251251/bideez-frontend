import { redirect } from "next/navigation"
import { LogOut, FileText } from "lucide-react"

import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch the true user profile from our database
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(user.email!)}`,
    { cache: "no-store" }
  )

  // If the profile doesn't exist OR onboarding is incomplete, redirect
  if (!res.ok) {
    redirect("/auth?onboarding=true")
  }

  const profileData = await res.json()

  if (!profileData.onboardingComplete) {
    redirect("/auth?onboarding=true")
  }

  const dbUser = profileData.user
  const dbCompany = profileData.company

  const userName =
    dbUser?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User"
  const userRole = dbUser?.role || "employee"
  const companyName = dbCompany?.name || null

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4">
      {/* ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[6%] size-[44rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute right-[8%] bottom-[-12%] size-[40rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="glass w-full max-w-2xl rounded-2xl p-8 md:p-12 animate-rise">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              bideez
            </span>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            WELCOME BACK
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {userName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {userRole === "owner" ? "Founder" : "Member"}
            </span>
            {companyName && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {companyName}
              </span>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">
            Upload Your RFP
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Drop your RFP, RFQ, or Tender document here to start the
            AI-powered bid analysis pipeline.
          </p>
        </div>
      </div>
    </div>
  )
}
