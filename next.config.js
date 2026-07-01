/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
    ],
  },
  async headers() {
    return [
      {
        // Publieke embed-pagina's mogen in een <iframe> op elk domein staan
        // (voor bv. Blackboard). Rest van de app blijft standaard beveiligd.
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
