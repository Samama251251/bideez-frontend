import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // shadcn/ui imports from the unified `radix-ui` barrel package; opt it into
    // per-module transforms so only the primitives we use get bundled.
    // (`lucide-react` is already optimized by Next.js defaults.)
    optimizePackageImports: ["radix-ui"],
  },
}

export default nextConfig
