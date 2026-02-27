/**
 * DAS (Digital Asset Standard) utilities for fetching NFTs.
 *
 * NOTE: The default devnet RPC does not support DAS methods (searchAssets,
 * getAssetsByOwner). You need a DAS-compatible provider such as Helius,
 * Triton, or a similar RPC. Set NEXT_PUBLIC_RPC_ENDPOINT accordingly.
 */

// ---- Response types ----

export interface DasAsset {
  id: string;
  content: {
    json_uri: string;
    metadata: { name: string; symbol: string; description?: string };
    links?: { image?: string; external_url?: string };
    files?: { uri: string; cdn_uri?: string; mime?: string }[];
  };
  grouping: { group_key: string; group_value: string }[];
  ownership: { owner: string; delegate?: string; frozen: boolean };
  compression?: { compressed: boolean; tree?: string; leaf_index?: number };
}

export interface DasResponse {
  jsonrpc: '2.0';
  id: string;
  result: {
    total: number;
    limit: number;
    page: number;
    items: DasAsset[];
  };
  error?: { code: number; message: string };
}

// ---- Helpers ----

async function dasRpc(
  rpcEndpoint: string,
  method: string,
  params: Record<string, unknown>,
  id = 'radiator-das',
): Promise<DasResponse> {
  const res = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });

  if (!res.ok) {
    throw new Error(`DAS RPC error: ${res.status} ${res.statusText}`);
  }

  const json: DasResponse = await res.json();
  if (json.error) {
    throw new Error(`DAS RPC: ${json.error.message} (${json.error.code})`);
  }
  return json;
}

// ---- Public API ----

/**
 * Fetch all assets in a collection, optionally filtered by owner.
 * Supports auto-pagination — returns all items across pages.
 */
export async function getCollectionAssets(
  rpcEndpoint: string,
  collection: string,
  owner?: string,
  pageSize = 1000,
): Promise<{ assets: DasAsset[]; total: number }> {
  const allAssets: DasAsset[] = [];
  let page = 1;
  let total = 0;

  do {
    const params: Record<string, unknown> = {
      grouping: ['collection', collection],
      page,
      limit: pageSize,
    };
    if (owner) params.ownerAddress = owner;

    const json = await dasRpc(rpcEndpoint, 'searchAssets', params);
    total = json.result.total;
    allAssets.push(...json.result.items);

    if (json.result.items.length < pageSize) break;
    page++;
  } while (allAssets.length < total);

  return { assets: allAssets, total };
}

/**
 * Fetch all assets owned by a wallet, optionally filtered by collection.
 */
export async function getAssetsByOwner(
  rpcEndpoint: string,
  owner: string,
  collection?: string,
  pageSize = 1000,
): Promise<{ assets: DasAsset[]; total: number }> {
  const allAssets: DasAsset[] = [];
  let page = 1;
  let total = 0;

  do {
    const json = await dasRpc(rpcEndpoint, 'getAssetsByOwner', {
      ownerAddress: owner,
      page,
      limit: pageSize,
    });
    total = json.result.total;

    let items = json.result.items;
    if (collection) {
      items = items.filter((a) =>
        a.grouping.some(
          (g) => g.group_key === 'collection' && g.group_value === collection,
        ),
      );
    }
    allAssets.push(...items);

    if (json.result.items.length < pageSize) break;
    page++;
  } while (allAssets.length < total);

  return { assets: allAssets, total: allAssets.length };
}

/**
 * Extract the best image URL from a DAS asset.
 */
export function getAssetImage(asset: DasAsset): string {
  return (
    asset.content.links?.image ??
    asset.content.files?.[0]?.cdn_uri ??
    asset.content.files?.[0]?.uri ??
    ''
  );
}
