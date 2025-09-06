import type { NextConfig } from "next";

/**
 * Quick MVP build: ignore TypeScript and ESLint errors during build
 */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
