
import createNextPwa from 'next-pwa';

const isDev = process.env.NODE_ENV === 'development';

const withPWA = createNextPwa({
  dest: 'public',
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
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default withPWA(nextConfig);
