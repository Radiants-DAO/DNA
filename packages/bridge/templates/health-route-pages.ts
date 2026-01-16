/**
 * RadFlow Health Endpoint - Pages Router
 *
 * This file is automatically created by RadFlow in the target project at:
 * pages/api/__radflow/health.ts
 *
 * DO NOT EDIT - This file is managed by RadFlow
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    ok: true,
    version: '0.1.0',
    timestamp: Date.now(),
  });
}
