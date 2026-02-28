'use client';

import { useToast } from '@rdna/radiants/components/core';

/**
 * Radiator-specific toast messages wrapping the RDNA ToastProvider.
 */
export function useRadiatorToast() {
  const { addToast } = useToast();

  return {
    txSuccess: (sig: string) =>
      addToast({
        variant: 'success',
        title: 'TRANSACTION CONFIRMED',
        description: `Signature: ${sig.slice(0, 8)}...`,
      }),

    txError: (err: Error) =>
      addToast({
        variant: 'error',
        title: 'TRANSACTION FAILED',
        description: err.message,
      }),

    walletRequired: () =>
      addToast({
        variant: 'warning',
        title: 'WALLET REQUIRED',
        description: 'Connect your wallet to continue',
      }),

    burnComplete: (name: string) =>
      addToast({
        variant: 'success',
        title: `${name} IRRADIATED`,
        description: 'Sacrifice accepted',
      }),

    deploySuccess: () =>
      addToast({
        variant: 'success',
        title: 'RADIATOR DEPLOYED',
        description: 'Your radiator is live on-chain',
      }),

    claimCreated: () =>
      addToast({
        variant: 'info',
        title: 'CLAIM SEALED',
        description: 'Your fate is locked — time to feed the radiator',
      }),

    swapComplete: () =>
      addToast({
        variant: 'success',
        title: 'IRRADIATION COMPLETE',
        description: 'Your 1/1 has been forged',
      }),
  };
}
