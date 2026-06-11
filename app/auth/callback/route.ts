import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session?.user?.email) {
    return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`)
  }

  // Determine the base URL for redirects
  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  // Check if user has COMPLETED onboarding (has a company assigned).
  // The Supabase trigger auto-creates a user row, so "user exists" is NOT enough.
  // We must check onboardingComplete === true.
  let onboardingComplete = false
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(session.user.email)}`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const data = await res.json()
      onboardingComplete = data.onboardingComplete === true
    }
  } catch {
    // Backend unreachable — send to onboarding as a safe default
  }

  if (!onboardingComplete) {
    return NextResponse.redirect(`${baseUrl}/auth?onboarding=true`)
  }

  return NextResponse.redirect(`${baseUrl}${next}`)
}
