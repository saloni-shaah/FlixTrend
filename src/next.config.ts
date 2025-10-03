
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
  runtimeCaching: [
    {
      urlPattern: /.*/i,
      handler: isDev ? 'NetworkFirst' : 'CacheFirst',
      options: {
        cacheName: 'all-content-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'api.dicebear.com',
        },
        {
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com',
        }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/apple-app-site-association',
        destination: '/apple-app-site-association',
      },
    ];
  },
};

// The type definition for the PWA wrapper is not perfectly aligned with NextConfig,
// so we use a type assertion to satisfy TypeScript.
export default withPWA(pwaConfig)(nextConfig) as (phase: string, defaultConfig: {}) => Promise<any>;
