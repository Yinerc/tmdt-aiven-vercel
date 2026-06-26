/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'cdn1.viettelstore.vn',
      },

      // Cho phép tất cả subdomain của gstatic
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
    ],
  },
};

module.exports = nextConfig;