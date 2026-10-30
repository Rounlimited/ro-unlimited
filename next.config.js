/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: false,
  // Next downlevels OUR code for its default targets (Safari 12+, Chrome 64+)
  // but ships node_modules verbatim. These packages contain `??` / `?.`, which
  // Safari 12 (the newest Safari on macOS Sierra) cannot parse — one bad chunk
  // and the whole page shows "a client-side exception has occurred". The
  // customer estimate link loads number-flow; every admin page loads Supabase.
  // Checked with: parse every .next/static chunk at ecmaVersion 2019.
  transpilePackages: [
    'number-flow', '@number-flow/react',
    '@supabase/supabase-js', '@supabase/ssr', '@supabase/auth-js', '@supabase/postgrest-js',
    '@supabase/storage-js', '@supabase/realtime-js', '@supabase/functions-js',
    'iceberg-js', // storage-js dependency; it is where the `?.` actually lives
    'cookie',     // @supabase/ssr dependency, same story
  ],
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
