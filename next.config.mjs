/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    authInterrupts: true
  },
  transpilePackages: [
    'three',
  ],
};

export default nextConfig
