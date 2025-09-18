/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docs app runs on port 3001 to avoid conflicts with Frey (port 3000)
  devIndicators: {
    buildActivity: true,
  },
  // Optional: Add any other Next.js config here
};

module.exports = nextConfig;
