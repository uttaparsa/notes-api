/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:9800/api/:path*/',
      },
      {
        source: '/media/:path*',
        destination: 'http://localhost:9800/media/:path*/',
      },
    ];
  },
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
