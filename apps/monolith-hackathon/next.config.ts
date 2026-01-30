import type { NextConfig } from 'next';
import { withRadflow } from '@rdna/bridge/next';

const nextConfig: NextConfig = {};

export default withRadflow(nextConfig);
