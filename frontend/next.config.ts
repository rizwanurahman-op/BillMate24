import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Set the root to the frontend directory to properly resolve modules
    root: process.cwd(),
  },
};

export default nextConfig;

