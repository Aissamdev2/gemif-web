/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    ppr: true,
    authInterrupts: true
  },
  transpilePackages: [
    'three',
  ]
};

export default nextConfig
