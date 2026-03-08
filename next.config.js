/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['cdn.sanity.io'],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};
module.exports = nextConfig;
