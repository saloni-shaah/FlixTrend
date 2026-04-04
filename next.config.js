/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  allowedDevOrigins: ['3000-firebase-studio-1771359278488.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev'],
};

module.exports = nextConfig;
