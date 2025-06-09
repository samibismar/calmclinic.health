import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.creativefabrica.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // optional: add more as needed
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
    ],
  }
};

export default nextConfig;
