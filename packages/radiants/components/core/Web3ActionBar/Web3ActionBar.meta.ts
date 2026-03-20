import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface Web3ActionBarProps {
  isConnected: boolean;
  walletAddress?: string;
  onConnect: string;
  onDisconnect: string;
  className?: string;
}

export const Web3ActionBarMeta = defineComponentMeta<Web3ActionBarProps>()({
  name: "Web3ActionBar",
  description:
    "Solana wallet connection action bar. Shows connect button or connected wallet address with disconnect option.",
  props: {
    isConnected: {
      type: "boolean",
      required: true,
      description: "Whether a wallet is currently connected",
    },
    walletAddress: {
      type: "string",
      description: "Connected wallet address for display",
    },
    onConnect: {
      type: "string",
      required: true,
      description: "Callback to initiate wallet connection",
    },
    onDisconnect: {
      type: "string",
      required: true,
      description: "Callback to disconnect wallet",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Disconnected state",
      code: "<Web3ActionBar isConnected={false} onConnect={handleConnect} onDisconnect={handleDisconnect} />",
    },
    {
      name: "Connected state",
      code: '<Web3ActionBar isConnected walletAddress="7xKXtg...vbMuXY" onConnect={handleConnect} onDisconnect={handleDisconnect} />',
    },
  ],
  registry: {
    category: "data-display",
    tags: ["wallet", "web3", "solana"],
    renderMode: "custom",
  },
});
