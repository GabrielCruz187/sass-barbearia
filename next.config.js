/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "ajt7oauszyilhxi9.public.blob.vercel-storage.com",
      "public.blob.vercel-storage.com",
      "vercel-storage.com",
      "blob.vercel-storage.com",
      "vercel-blob.com",
    ],
  },
}

module.exports = nextConfig
