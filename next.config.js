/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    minimumCacheTTL: 2678400, // 31 days — service images rarely change
  },
  // Surfaced in AI Settings diagnostics so we can tell whether a device is
  // actually running the current build (stale PWA caches look like bugs)
  env: {
    NEXT_PUBLIC_BUILD_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
    // msedge-tts uses ws + runtime version detection — must stay unbundled
    serverComponentsExternalPackages: ['msedge-tts'],
  },
};
module.exports = nextConfig;
