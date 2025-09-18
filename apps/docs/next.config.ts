import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docs app runs on port 3001 to avoid conflicts with Frey (port 3000)
  devIndicators: {
    buildActivity: true,
  },
  /* config options here */
};

export default nextConfig;
