/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)', // Matches all routes
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'ETag',
            value: '', // Remove ETag header
          },
          {
            key: 'Last-Modified',
            value: '', // Remove Last-Modified header
          },
        ],
      },
    ];
  },
};

export default nextConfig;
