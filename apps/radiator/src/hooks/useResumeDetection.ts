'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { USE_MOCK_CHAIN } from '@/constants';
import { createRadiatorClient } from '@/lib/radiator-client';

/**
 * On wallet connect, checks if the holder has a partial burn flow for the
 * currently loaded radiator config. If so, drops them into the correct scene
 * at the right fuel level instead of restarting from scratch.
 *
 * In mock mode this is a no-op — there's no on-chain state to check.
 */
export function useResumeDetection(walletAddress: string | null) {
  const config = useAppStore((s) => s.config);
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);
  const setEntangledPair = useAppStore((s) => s.setEntangledPair);
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only check once per wallet+config combo, and only from landing
    if (!walletAddress || !config) return;
    if (currentView !== 'landing') return;
    if (USE_MOCK_CHAIN) return;

    const cacheKey = `${walletAddress}:${config.configAccountKey}`;
    if (checkedRef.current === cacheKey) return;
    checkedRef.current = cacheKey;

    (async () => {
      try {
        const client = await createRadiatorClient();

        // Check each offering index for an existing EntangledPair
        for (let i = 0; i < config.offeringSize; i++) {
          const result = await client.getEntangledPair(
            config.configAccountKey,
            i,
          );

          if (result?.data) {
            const pair = result.data as {
              swapHappened?: boolean;
              offeringRealized?: number;
            };

            if (!pair.swapHappened) {
              setEntangledPair(result.address);

              // Determine which scene to resume at
              const realized = pair.offeringRealized ?? 0;
              if (realized >= config.offeringSize - 1) {
                setView('ignite');
              } else {
                setView('feed-radiator');
              }
              return;
            }
          }
        }
      } catch {
        // Silent fail — user can restart manually from landing
      }
    })();
  }, [walletAddress, config, currentView, setView, setEntangledPair]);
}
