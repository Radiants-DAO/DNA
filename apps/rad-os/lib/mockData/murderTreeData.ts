/**
 * Murder Tree Data Generator
 *
 * Generates mock murder tree data from real auction metadata.
 * Extracts collection burn information from Radiant NFT attributes.
 */

import allMetadataData from './nft-metadata/all-metadata.json';
import { type MurderTreeNFT, type MurderTreeBranch } from '@/components/murderTree';

// ============================================================================
// Types
// ============================================================================

interface NFTMetadata {
  name: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

// Known collection names from the metadata
const KNOWN_COLLECTIONS = [
  'BAPE',
  'Bears Reloaded',
  'Ded Monkes',
  'Lifinity',
  'BASE',
  'SolBears',
  'y00ts',
  'DeGods',
  'Claynosaurz',
  'Famous Fox',
  'Okay Bears',
  'SMB',
  'Tensorians',
  'Netrunner',
  'Phase',
  'Energy',
  'Dooks',
  'P2',
  'Sol Slugs',
  'Trash Panda',
  'Hostage',
  'Antidote',
  'Bees',
  'CashGrab',
  'NGMI',
  'SighDuck',
  'Test',
];

// Placeholder images for different collections (cycling through radiant images)
const PLACEHOLDER_IMAGES = [
  '/assets/radiants/radiant-001.avif',
  '/assets/radiants/radiant-002.avif',
  '/assets/radiants/radiant-003.avif',
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if an attribute is a collection count (not a mint address SOL value)
 */
function isCollectionAttribute(attr: { trait_type: string; value: string | number }): boolean {
  // Skip known non-collection attributes
  const skipTypes = ['Number', 'SOL', 'USD', 'NFTs Burned'];
  if (skipTypes.includes(attr.trait_type)) return false;

  // Skip mint addresses (typically 32+ chars and alphanumeric)
  if (attr.trait_type.length > 30) return false;

  // Value should be a reasonable count (number)
  const numValue = typeof attr.value === 'number' ? attr.value : parseInt(String(attr.value));
  return !isNaN(numValue) && numValue > 0 && numValue < 1000;
}

/**
 * Generate mock NFTs for a collection
 */
function generateMockNftsForCollection(
  collectionName: string,
  count: number,
  radiantNumber: string
): MurderTreeNFT[] {
  const nfts: MurderTreeNFT[] = [];
  const actualCount = Math.min(count, 50); // Cap at 50 for display

  for (let i = 0; i < actualCount; i++) {
    nfts.push({
      id: `${radiantNumber}-${collectionName.toLowerCase().replace(/\s/g, '-')}-${i}`,
      name: `${collectionName} #${1000 + i}`,
      collection: collectionName,
      image: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
      value: Math.random() * 5, // Mock value between 0-5 SOL
    });
  }

  return nfts;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get murder tree data for a specific Radiant by mint address
 */
export function getMurderTreeForRadiant(mintAddress: string): {
  radiantImage: string;
  radiantName: string;
  branches: MurderTreeBranch[];
} | null {
  const metadata = (allMetadataData as Record<string, NFTMetadata>)[mintAddress];
  if (!metadata) return null;

  const radiantNumber = metadata.attributes.find(a => a.trait_type === 'Number')?.value || '???';

  // Extract collection data from attributes
  const collectionBranches: MurderTreeBranch[] = [];

  // Group by known collections
  const provenanceNfts: MurderTreeNFT[] = [];

  for (const attr of metadata.attributes) {
    if (isCollectionAttribute(attr)) {
      const count = typeof attr.value === 'number' ? attr.value : parseInt(String(attr.value));
      const nfts = generateMockNftsForCollection(attr.trait_type, count, String(radiantNumber));
      provenanceNfts.push(...nfts);
    }
  }

  // Create a single "Provenance" branch with all burned NFTs
  if (provenanceNfts.length > 0) {
    collectionBranches.push({
      title: 'Provenance',
      nfts: provenanceNfts,
    });
  }

  return {
    radiantImage: metadata.image,
    radiantName: metadata.name,
    branches: collectionBranches,
  };
}

/**
 * Get murder tree data for a Radiant by number (e.g., "016", "023")
 */
export function getMurderTreeByNumber(radiantNumber: string): {
  radiantImage: string;
  radiantName: string;
  branches: MurderTreeBranch[];
  mintAddress: string;
} | null {
  const allMetadata = allMetadataData as Record<string, NFTMetadata>;

  // Find the radiant with matching number
  for (const [mintAddress, metadata] of Object.entries(allMetadata)) {
    const numberAttr = metadata.attributes.find(a => a.trait_type === 'Number');
    if (numberAttr && String(numberAttr.value) === radiantNumber) {
      const treeData = getMurderTreeForRadiant(mintAddress);
      if (treeData) {
        return {
          ...treeData,
          mintAddress,
        };
      }
    }
  }

  return null;
}

/**
 * Get all available Radiants with murder tree data
 */
export function getAllRadiantsWithMurderTree(): Array<{
  mintAddress: string;
  name: string;
  number: string;
  totalBurned: number;
}> {
  const allMetadata = allMetadataData as Record<string, NFTMetadata>;
  const radiants: Array<{
    mintAddress: string;
    name: string;
    number: string;
    totalBurned: number;
  }> = [];

  for (const [mintAddress, metadata] of Object.entries(allMetadata)) {
    const numberAttr = metadata.attributes.find(a => a.trait_type === 'Number');
    const burnedAttr = metadata.attributes.find(a => a.trait_type === 'NFTs Burned');

    if (numberAttr) {
      radiants.push({
        mintAddress,
        name: metadata.name,
        number: String(numberAttr.value),
        totalBurned: burnedAttr
          ? (typeof burnedAttr.value === 'number' ? burnedAttr.value : parseInt(String(burnedAttr.value)))
          : 0,
      });
    }
  }

  // Sort by number
  return radiants.sort((a, b) => a.number.localeCompare(b.number));
}

/**
 * Get a summary of burned collections for a radiant
 */
export function getBurnedCollectionsSummary(mintAddress: string): Array<{
  collection: string;
  count: number;
}> {
  const metadata = (allMetadataData as Record<string, NFTMetadata>)[mintAddress];
  if (!metadata) return [];

  const collections: Array<{ collection: string; count: number }> = [];

  for (const attr of metadata.attributes) {
    if (isCollectionAttribute(attr)) {
      const count = typeof attr.value === 'number' ? attr.value : parseInt(String(attr.value));
      collections.push({
        collection: attr.trait_type,
        count,
      });
    }
  }

  return collections.sort((a, b) => b.count - a.count);
}
