import { PublicKey } from "@solana/web3.js";

interface DasParams {
  grouping: string[];
  page: number;
  limit: number;
  ownerAddress?: string;
};

export const getCollectionAssets = async (
  rpcEndpoint: string,
  collection: PublicKey,
  owner?: PublicKey,
  page: number = 1,
  limit: number = 1000
) => {

  let params: DasParams = {
    grouping: ["collection", collection.toBase58()],
    page,
    limit
  };

  if (owner) {
    params.ownerAddress = owner.toBase58();
  }

  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'radiator-assets-search',
      method: 'searchAssets',
      params
    }),
  });
  return await response.json();
}