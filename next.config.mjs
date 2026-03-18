/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all domains for simplicity in MVP, or restrict to supabase project
      },
    ],
    // Keep unoptimized: false for production performance unless specific issue arises
    unoptimized: true,
  },

  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
