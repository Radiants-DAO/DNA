import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@chenglou/pretext"],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  webpack: (config) => {
    // Allow webpack to resolve font/asset files from the monorepo root
    // (required for Vercel builds where rootDirectory is apps/rad-os)
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      monorepoRoot,
    ];
    return config;
  },
};

export default nextConfig;
