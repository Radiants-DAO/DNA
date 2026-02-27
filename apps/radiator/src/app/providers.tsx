'use client';

import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { defaultRpcEndpoint } from "@/constants";
import { ConnectionConfig } from "@solana/web3.js";
require("@solana/wallet-adapter-react-ui/styles.css");

export function Providers({ children }: any) {
  const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || defaultRpcEndpoint;
  console.log('endpoint: ', endpoint);

  const network = endpoint.includes("devnet")
    ? WalletAdapterNetwork.Devnet
    : WalletAdapterNetwork.Mainnet;

  const connectionConfig: ConnectionConfig = {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000
  };

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}