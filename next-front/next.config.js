/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:9800/api/:path*/',
      },
      {
        source: '/media/:path*',
        destination: 'http://backend:9800/media/:path*/',
      },
    ];
  },
  output: 'standalone'
}

module.exports = nextConfig
