/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['e2b.app', '*.e2b.app'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.dualite.app' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'framerusercontent.com' },
    ],
  },
};

export default nextConfig;
