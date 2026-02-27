"use client";

import { getCollectionAssets } from "@/utils";
import { TheRadiatorCore } from "@radiants-dao/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

export default function () {
  const { connection } = useConnection();
  const wallet = useWallet();

  //@ts-ignore
  const radiator = new TheRadiatorCore(connection, wallet);

  const createRadiator = async () => {
    const collection = new PublicKey('8gwhwX2t6YyL58JH7E4ao8stwzFm8WyXfLLyW4zVLc19');

    const { result: { items } } = await getCollectionAssets(connection.rpcEndpoint, collection);

    console.log("burnableAssets:", items);

    const elements = items.map((nft: any) => ({
      address: new PublicKey(nft.id),
      name: nft.content.metadata.name,
      uri: nft.content.json_uri
    }));

    console.log("elements:", elements);

    const tx = await radiator.createConfig(
      elements,
      wallet.publicKey!,
      wallet.publicKey!,
      2,
      true,
      undefined,
      collection
    );

    console.log('tx: ', tx);
  }

  return (<>
    <h1>SETUP</h1>

    <button onClick={createRadiator}>
      Create new radiator
    </button>
  </>);
}
