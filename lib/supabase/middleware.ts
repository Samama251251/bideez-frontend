import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token — IMPORTANT: don't remove this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/")

  // Redirect unauthenticated users away from protected routes
  if (!user && !isAuthRoute && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from /auth UNLESS:
  //   1. They are on /auth?onboarding=true (completing their Google profile)
  //   2. They are hitting /auth/callback (exchanging the OAuth code)
  //   3. They are hitting /auth/signout (signing out)
  if (user && pathname === "/auth") {
    const isOnboarding =
      request.nextUrl.searchParams.get("onboarding") === "true"
    if (!isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
