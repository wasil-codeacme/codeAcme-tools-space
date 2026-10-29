import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  // SAMEORIGIN, not DENY: the report dialog previews the app's own PDFs in a frame. Other sites still
  // cannot frame the app.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep pages you have visited in the browser for five minutes, so going back to them is
    // instant. Every save calls refresh(), which clears this cache, so your own changes always show.
    staleTimes: { dynamic: 300 },
  },
  reactStrictMode: true,
  // react-pdf ships its own font/layout engines that must not be bundled by Turbopack.
  serverExternalPackages: ['@react-pdf/renderer'],
  // The PDF renderer reads the logo from disk at request time, so the file must ship with the function.
  outputFileTracingIncludes: {
    '/api/tools/time-tracking/reports/export': ['./src/server/reports/assets/**/*'],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
