"use client";

import { getCollectionAssets } from "@/utils";
import { useEffect, useState } from "react";
import { TheRadiatorCore } from "@radiants-dao/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function RadiatorBurner() {
  const { wallet } = useWallet();
  const { connection } = useConnection();

  const [validNFTs, setValidNFTs] = useState<{ name: string }[] | []>([]);

  // @ts-ignore
  const theRadiator = new TheRadiatorCore(connection, wallet!);

  const collection = new PublicKey("dddddd");

  useEffect(() => {
    (async () => {
      const burnableAssets = await getCollectionAssets(connection.rpcEndpoint, collection);
      setValidNFTs(burnableAssets);
    })()
  });

  return <>
    <div>
      <WalletMultiButton />
      <WalletDisconnectButton />
    </div>
    <div>
      {validNFTs.length && validNFTs.map(nft => (<p>NFT {nft.name}</p>))}
    </div>
  </>;
}