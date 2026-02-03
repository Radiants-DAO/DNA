import type { NextConfig } from 'next';
// import { withRadflow } from '@rdna/bridge/next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
