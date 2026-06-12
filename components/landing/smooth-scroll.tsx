"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "locomotive-scroll/locomotive-scroll.css"

import type LocomotiveScroll from "locomotive-scroll"

/**
 * Drives the landing page's motion layer:
 *  - Locomotive Scroll v5 (Lenis-based, native scroll) for inertia smoothing.
 *    Native scroll means fixed elements (nav, ambient backdrop) keep working and
 *    GSAP ScrollTrigger can use the default window scroller — no scrollerProxy.
 *  - GSAP ScrollTrigger reveals: section intros ([data-animate]) and .glass cards
 *    fade + rise into view as you scroll.
 *  - Smooth in-page navigation for every `#anchor` link.
 *
 * Renders nothing. Fully disabled under prefers-reduced-motion (content stays
 * visible and static). Scoped to the landing page only — not the app shell.
 */
export function SmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    // Reduced motion: leave the page entirely static and visible.
    if (prefersReduced) return

    gsap.registerPlugin(ScrollTrigger)

    // Signals globals.css to apply the pre-reveal hidden state. Everything that
    // animates lives below the fold, so the hand-off is invisible.
    const root = document.documentElement
    root.classList.add("reveal-ready")

    let loco: LocomotiveScroll | null = null
    let ctx: gsap.Context | null = null
    let cancelled = false

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      const anchor = (event.target as HTMLElement)?.closest<HTMLAnchorElement>(
        'a[href^="#"]'
      )
      const href = anchor?.getAttribute("href")
      if (!anchor || !href || href === "#") return
      const target = document.querySelector(href)
      if (!target) return
      event.preventDefault()
      loco?.scrollTo(target as HTMLElement, { offset: -100, duration: 1.1 })
    }

    const setupReveals = () => {
      ctx = gsap.context(() => {
        // Hero orbital nodes — staggered float-in on load (above fold, no ST).
        gsap.from(".hero-node", {
          opacity: 0,
          y: 22,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.09,
          delay: 0.55,
        })

        // Hero SVG connector paths — stroke draw-on on load.
        const connectorPaths =
          document.querySelectorAll<SVGPathElement>(".hero-connectors path")
        connectorPaths.forEach((path, i) => {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power2.inOut",
            delay: 0.75 + i * 0.18,
          })
        })

        // Section intros and standalone callouts.
        gsap.utils.toArray<HTMLElement>("[data-animate]").forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          })
        })

        // Frosted cards reveal in batches so each grid row staggers together.
        ScrollTrigger.batch(".glass", {
          start: "top 88%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.1,
              overwrite: true,
            }),
        })

        // Dark cards (Intake / Loop grids) — staggered batch reveal.
        ScrollTrigger.batch("[data-animate-card]", {
          start: "top 88%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: "power3.out",
              stagger: 0.12,
              overwrite: true,
            }),
        })
      })
    }

    ;(async () => {
      const Locomotive = (await import("locomotive-scroll")).default
      if (cancelled) return

      loco = new Locomotive({
        lenisOptions: {
          lerp: 0.085,
          duration: 1.2,
          smoothWheel: true,
          wheelMultiplier: 1,
        },
        // Keep ScrollTrigger in sync with every smoothed scroll frame, and drive
        // Locomotive's render loop off GSAP's ticker so they share one RAF.
        scrollCallback: () => ScrollTrigger.update(),
        initCustomTicker: (render) => gsap.ticker.add(render),
        destroyCustomTicker: (render) => gsap.ticker.remove(render),
      })

      setupReveals()
      document.addEventListener("click", onAnchorClick)
      // Recompute trigger positions once fonts/layout have settled.
      requestAnimationFrame(() => ScrollTrigger.refresh())
    })()

    return () => {
      cancelled = true
      document.removeEventListener("click", onAnchorClick)
      root.classList.remove("reveal-ready")
      ctx?.revert()
      loco?.destroy()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return null
}
