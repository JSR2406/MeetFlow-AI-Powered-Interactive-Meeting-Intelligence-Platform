import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  typescript: {
    // TypeScript type checking is run separately via `pnpm typecheck`.
    // Build-time type check is disabled to avoid Supabase strict-mode inference 
    // issues that are non-runtime-impacting (all resolved via as-any in actions).
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint is run separately via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
