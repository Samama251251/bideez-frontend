"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Building, Loader2, Globe, MapPin, Briefcase } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"

type Mode = "signin" | "signup" | "onboarding"
type Role = "owner" | "employee"

export function AuthForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Client-side detection of onboarding mode — this is the definitive source
  // of truth, because the URL ?onboarding=true is always present when needed.
  const resolvedInitialMode: Mode = searchParams.get("onboarding") === "true"
    ? "onboarding"
    : initialMode

  const [mode, setMode] = React.useState<Mode>(resolvedInitialMode)
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Form fields
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<Role>("owner")
  const [companyName, setCompanyName] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [expertise, setExpertise] = React.useState("")

  const isSignup = mode === "signup"
  const isOnboarding = mode === "onboarding"

  async function handleGoogleAuth() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (isOnboarding) {
        // Pre-flight check
        if (role === "employee") {
          const checkRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-company?name=${encodeURIComponent(companyName)}`
          )
          if (checkRes.status === 404) {
            throw new Error(`No company named "${companyName}" exists. Please check the name or contact your company's founder.`)
          }
          if (!checkRes.ok) throw new Error("Failed to verify company. Please try again.")
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error("Could not fetch user session. Please try signing in again.")

        // Call backend to create user profile & company in our DB
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email,
            role,
            companyName,
            domain: role === "owner" ? domain : undefined,
            location: role === "owner" ? location : undefined,
            department: role === "employee" ? expertise : undefined,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || data.error || "Profile creation failed. Please contact support.")
        }
        
        router.push("/dashboard")
        return
      }

      if (isSignup) {
        // Pre-flight check: If they are joining as a member, ensure the company exists FIRST
        // so we don't create an orphaned Supabase auth user.
        if (role === "employee") {
          const checkRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-company?name=${encodeURIComponent(companyName)}`
          )
          if (checkRes.status === 404) {
            throw new Error(
              `No company named "${companyName}" exists. Please check the name or contact your company's founder.`
            )
          }
          if (!checkRes.ok) {
            throw new Error("Failed to verify company. Please try again.")
          }
        }

        // 1. Sign up with Supabase first to ensure the auth account is created
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              company_name: companyName,
            },
          },
        })

        if (signUpError) throw signUpError

        // 2. Call backend to create user profile & company in our DB
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            role,
            companyName,
            domain: role === "owner" ? domain : undefined,
            location: role === "owner" ? location : undefined,
            department: role === "employee" ? expertise : undefined,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || data.error || "Profile creation failed. Please contact support.")
        }

        // 3. Handle Email Confirmation state
        if (!authData.session) {
          setSuccess("Account created! Please check your email to confirm your account before signing in.")
          setMode("signin")
          return
        }

        router.push("/dashboard")
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-rise">
      {/* compact brand mark for small screens */}
      <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        <span className="font-display text-lg font-semibold tracking-tight">
          bideez
        </span>
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {isOnboarding ? "Complete your profile" : isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isOnboarding
          ? "Tell us a bit about your role to get started."
          : isSignup
            ? "Start scoring opportunities in minutes."
            : "Sign in to pick up where you left off."}
      </p>

      {/* mode toggle */}
      {!isOnboarding && (
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setError(null)
              }}
              className={cn(
                "rounded-full py-1.5 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      {/* SSO */}
      {!isOnboarding && (
        <>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-6 w-full"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
              OR
            </span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      {isOnboarding && <div className="mt-6" />}

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-primary/15 p-3 text-sm text-primary">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {(isSignup || isOnboarding) && (
          <>
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    role === "owner"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  Founder
                </button>
                <button
                  type="button"
                  onClick={() => setRole("employee")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    role === "employee"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  Member
                </button>
              </div>
            </div>

            {!isOnboarding && (
              <Field
                id="name"
                label="Full name"
                icon={<User className="size-4" />}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Field
              id="companyName"
              label={role === "owner" ? "Company name" : "Join company"}
              icon={<Building className="size-4" />}
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />

            {role === "owner" && (
              <>
                <Field
                  id="domain"
                  label="Company domain"
                  icon={<Globe className="size-4" />}
                  type="text"
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />

                <Field
                  id="location"
                  label="Location"
                  icon={<MapPin className="size-4" />}
                  type="text"
                  placeholder="San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </>
            )}

            {role === "employee" && (
              <Field
                id="expertise"
                label="Your expertise"
                icon={<Briefcase className="size-4" />}
                type="text"
                placeholder="e.g. Cloud Security"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                required
              />
            )}
          </>
        )}

        {!isOnboarding && (
          <>
            <Field
              id="email"
              label="Work email"
              icon={<Mail className="size-4" />}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignup && (
                  <a
                    href="#"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Lock className="size-4" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="px-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isOnboarding ? (
            "Complete Profile"
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
          {!loading && <ArrowRight className="size-4 ml-2" />}
        </Button>
      </form>

      {!isOnboarding && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup")
              setError(null)
            }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      )}

      {(isSignup || isOnboarding) && (
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline underline-offset-2">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>
      )}
    </div>
  )
}

/* ------------------------------ field ------------------------------ */

function Field({
  id,
  label,
  icon,
  ...props
}: {
  id: string
  label: string
  icon: React.ReactNode
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {icon}
        </span>
        <Input id={id} className="pl-9" {...props} />
      </div>
    </div>
  )
}

/* ------------------------------ icons ------------------------------ */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
