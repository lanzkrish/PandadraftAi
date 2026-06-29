import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // NOTE: When the backend and frontend are hosted on the exact same domain (e.g., using a custom domain),
        // you can remove this rewrite configuration completely.
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5005/api/:path*' 
          : 'https://autodraftai.onrender.com/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5005/auth/:path*' 
          : 'https://autodraftai.onrender.com/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
