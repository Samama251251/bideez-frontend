"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type Mode = "signin" | "signup"

export function AuthForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const [mode, setMode] = React.useState<Mode>(initialMode)
  const [showPassword, setShowPassword] = React.useState(false)
  const isSignup = mode === "signup"

  // UI only — no auth wired up yet.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isSignup
          ? "Start scoring opportunities in minutes."
          : "Sign in to pick up where you left off."}
      </p>

      {/* mode toggle */}
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
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

      {/* SSO */}
      <Button type="button" variant="outline" className="mt-6 w-full">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <Field
            id="name"
            label="Full name"
            icon={<User className="size-4" />}
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
          />
        )}

        <Field
          id="email"
          label="Work email"
          icon={<Mail className="size-4" />}
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
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
              placeholder={isSignup ? "Create a password" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="px-9"
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

        <Button type="submit" className="w-full">
          {isSignup ? "Create account" : "Sign in"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignup ? "signin" : "signup")}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isSignup ? "Sign in" : "Sign up"}
        </button>
      </p>

      {isSignup && (
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
