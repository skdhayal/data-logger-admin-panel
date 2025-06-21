/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
    WS_URL: process.env.WS_URL || 'ws://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:3000/api/v1:path*`,
      },
    ];
  },
  transpilePackages: ['@mui/x-data-grid'],
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig; 