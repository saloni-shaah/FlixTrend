import withPWA from "next-pwa";

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  pwaExcludes: [/^(firebase-messaging-sw\.js|workbox-.*\.js)$/],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
        urlPattern: /.*/i,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 Day
            },
            cacheableResponse: {
                statuses: [0, 200],
            },
        },
    }
  ],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  allowedDevOrigins: [
    '3000-firebase-studio-1771359278488.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev',
    '6000-firebase-studio-1776275182221.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
    '9000-firebase-studio-1776275182221.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
    '9002-firebase-studio-1771359278488.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev'
  ],
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
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/apple-app-site-association',
        destination: '/apple-app-site-association',
      },
    ];
  },
  turbopack: {},
};

const pwaWrapper = withPWA(pwaConfig);

const finalConfig = typeof pwaWrapper === 'function' ? pwaWrapper(nextConfig) : nextConfig;

export default finalConfig;