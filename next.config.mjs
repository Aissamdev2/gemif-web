/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    authInterrupts: true
  },
  transpilePackages: [
    'three',
  ],
  cacheComponents: true,
};

export default nextConfig
