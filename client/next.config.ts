import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
    ];
  },
};

export default nextConfig;
