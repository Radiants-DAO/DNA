'use client';

import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ToastProvider } from '@rdna/radiants/components/core';
import { defaultRpcEndpoint } from '@/constants';
import { ConnectionConfig } from '@solana/web3.js';

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || defaultRpcEndpoint;

  const network = endpoint.includes('devnet')
    ? WalletAdapterNetwork.Devnet
    : WalletAdapterNetwork.Mainnet;

  const connectionConfig: ConnectionConfig = {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  };

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
