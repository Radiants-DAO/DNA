import { USE_MOCK_CHAIN } from '@/constants';
import type { Connection, PublicKey } from '@solana/web3.js';

// ---- Parameter & result types ----

export interface CreateConfigParams {
  artItems: { address: string; name: string; uri: string }[];
  updateAuthority: string;
  offeringSize: number;
  canBurn: boolean;
  treasuryMint?: string;
  collection?: string;
}

export interface CreateConfigResult {
  tx: string;
  root: number[];
}

export interface CreateClaimParams {
  configAccountAddress: string;
  nftMint: string;
  index: number;
  name: string;
  uri: string;
}

export interface CreateClaimResult {
  entangledPair: string;
  mintB: string;
  tokenAccountA: string;
  escrowAccountB: string;
}

export interface BurnParams {
  nftMint: string;
  configAccountKey: string;
  entangledPair: string;
  escrowAccountB: string;
}

export interface SwapParams {
  configAccountKey: string;
  mintA: string;
  mintB: string;
  entangledPair: string;
  tokenAccountA: string;
  escrowAccountB: string;
}

// ---- Client interface ----

export interface RadiatorClient {
  createConfig(params: CreateConfigParams): Promise<CreateConfigResult>;
  createClaim(params: CreateClaimParams): Promise<CreateClaimResult>;
  burnGasNFT(params: BurnParams): Promise<string>;
  swap(params: SwapParams): Promise<string>;
  getEntangledPair(configKey: string, index: number): Promise<{ data: unknown; address: string } | null>;
}

// ---- Mock implementation ----

function createMockClient(): RadiatorClient {
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const mockAddr = () => 'Mock' + Math.random().toString(36).slice(2, 10);

  return {
    async createConfig() {
      await delay(2000);
      return { tx: 'mock_tx_' + Date.now(), root: [0] };
    },

    async createClaim() {
      await delay(1500);
      return {
        entangledPair: mockAddr(),
        mintB: mockAddr(),
        tokenAccountA: mockAddr(),
        escrowAccountB: mockAddr(),
      };
    },

    async burnGasNFT() {
      await delay(1000);
      return 'mock_burn_' + Date.now();
    },

    async swap() {
      await delay(2000);
      return 'mock_swap_' + Date.now();
    },

    async getEntangledPair() {
      return null;
    },
  };
}

// ---- Live implementation (SDK calls) ----

async function createLiveClient(
  connection: Connection,
  wallet: unknown,
): Promise<RadiatorClient> {
  // Dynamic import keeps the SDK out of the initial bundle when mocked
  const { TheRadiatorCore } = await import(
    '@radiants-dao/core' as string
  );
  const { PublicKey: PK } = await import('@solana/web3.js');

  const core = new TheRadiatorCore(connection, wallet);

  return {
    async createConfig(params) {
      const elements = params.artItems.map((item) => ({
        address: new PK(item.address),
        name: item.name,
        uri: item.uri,
      }));
      const result = await core.createConfig(
        elements,
        new PK(params.updateAuthority),
        params.offeringSize,
        params.canBurn,
        params.treasuryMint ? new PK(params.treasuryMint) : undefined,
        params.collection ? new PK(params.collection) : undefined,
      );
      if (!result) throw new Error('createConfig returned undefined');
      return { tx: result.tx, root: result.root };
    },

    // These throw — SDK has hardcoded collection metadata blockers
    async createClaim() {
      throw new Error('createClaim not live — SDK blocker: hardcoded collection metadata');
    },
    async burnGasNFT() {
      throw new Error('burnGasNFT not live — SDK blocker: hardcoded collection metadata');
    },
    async swap() {
      throw new Error('swap not live — SDK blocker: RADIATOR_LUT is PublicKey.default');
    },

    async getEntangledPair(configKey, index) {
      const [data, address] = await core.getEntangledPair(new PK(configKey), index);
      if (!data) return null;
      return { data, address: address.toBase58() };
    },
  };
}

// ---- Factory ----

export async function createRadiatorClient(
  connection?: Connection,
  wallet?: unknown,
): Promise<RadiatorClient> {
  if (USE_MOCK_CHAIN) return createMockClient();

  if (!connection || !wallet) {
    throw new Error('Connection and wallet required for live client');
  }

  // Hybrid: live createConfig, mock everything else
  const live = await createLiveClient(connection, wallet);
  const mock = createMockClient();

  return {
    createConfig: live.createConfig,
    createClaim: mock.createClaim,
    burnGasNFT: mock.burnGasNFT,
    swap: mock.swap,
    getEntangledPair: mock.getEntangledPair,
  };
}
