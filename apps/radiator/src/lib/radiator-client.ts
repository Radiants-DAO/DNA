import { USE_MOCK_CHAIN } from '@/constants';
import type {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

type SignableTx = Transaction | VersionedTransaction;

interface WalletAdapterLike {
  publicKey: PublicKey | null;
  signTransaction?: <T extends SignableTx>(tx: T) => Promise<T>;
  signAllTransactions?: <T extends SignableTx>(txs: T[]) => Promise<T[]>;
}

interface AnchorWalletLike {
  publicKey: PublicKey;
  signTransaction: <T extends SignableTx>(tx: T) => Promise<T>;
  signAllTransactions: <T extends SignableTx>(txs: T[]) => Promise<T[]>;
}

// ---- Parameter & result types ----

export interface CreateConfigParams {
  artItems: { address: string; name: string; uri: string }[];
  offeringSize: number;
  canBurn: boolean;
  updateAuthority?: string;
  treasuryMint?: string;
  collection?: string;
}

export interface CreateConfigResult {
  tx: string;
  root: number[];
  configAccount?: string;
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
  getEntangledPair(
    configKey: string,
    index: number,
  ): Promise<{ data: unknown; address: string } | null>;
}

function toAnchorWallet(wallet: unknown): AnchorWalletLike {
  const adapter = wallet as WalletAdapterLike | undefined;

  if (!adapter?.publicKey) {
    throw new Error('Wallet public key is required for live chain calls');
  }
  if (!adapter.signTransaction) {
    throw new Error('Wallet does not support transaction signing');
  }

  return {
    publicKey: adapter.publicKey,
    signTransaction: <T extends SignableTx>(tx: T) => adapter.signTransaction!(tx),
    signAllTransactions: <T extends SignableTx>(txs: T[]) =>
      adapter.signAllTransactions
        ? adapter.signAllTransactions(txs)
        : Promise.all(txs.map((tx) => adapter.signTransaction!(tx))),
  };
}

function asBase58(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const maybePk = value as { toBase58?: () => string };
    if (typeof maybePk.toBase58 === 'function') {
      return maybePk.toBase58();
    }
  }
  return undefined;
}

// ---- Mock implementation ----

function createMockClient(): RadiatorClient {
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const mockAddr = () => 'Mock' + Math.random().toString(36).slice(2, 10);

  return {
    async createConfig() {
      await delay(2000);
      return { tx: 'mock_tx_' + Date.now(), root: [0], configAccount: mockAddr() };
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
  const anchorWallet = toAnchorWallet(wallet);
  const [{ TheRadiatorCore }, { PublicKey: PK }] = await Promise.all([
    import('@radiants-dao/core'),
    import('@solana/web3.js'),
  ]);

  const core = new TheRadiatorCore(connection, anchorWallet as never);

  return {
    async createConfig(params) {
      const creator = anchorWallet.publicKey;
      const elements = params.artItems.map((item) => ({
        address: new PK(item.address),
        name: item.name,
        uri: item.uri,
      }));

      const result = await core.createConfig(
        elements,
        creator,
        new PK(params.updateAuthority ?? creator.toBase58()),
        params.offeringSize,
        params.canBurn,
        params.treasuryMint ? new PK(params.treasuryMint) : undefined,
        params.collection ? new PK(params.collection) : undefined,
      );

      if (!result?.tx) {
        throw new Error('createConfig returned no transaction signature');
      }

      return {
        tx: result.tx as string,
        root: (result.root ?? []) as number[],
        configAccount: asBase58(result.configAccount),
      };
    },

    // These remain mocked in hybrid mode due known SDK blockers.
    async createClaim() {
      throw new Error(
        'createClaim not live: SDK burn path has hardcoded collection metadata',
      );
    },
    async burnGasNFT() {
      throw new Error(
        'burnGasNFT not live: SDK burn path has hardcoded collection metadata',
      );
    },
    async swap() {
      throw new Error('swap not live: SDK uses placeholder RADIATOR_LUT');
    },

    async getEntangledPair(configKey, index) {
      const result = await core.getEntangledPair(new PK(configKey), index as never);
      if (!result) return null;

      if (Array.isArray(result)) {
        const [data, address] = result;
        return { data, address: asBase58(address) ?? '' };
      }

      return { data: result, address: '' };
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
    throw new Error('Connection and wallet are required for live client mode');
  }

  // Hybrid mode: keep blocked flows mocked while createConfig is live.
  const live = await createLiveClient(connection, wallet);
  const mock = createMockClient();

  return {
    createConfig: live.createConfig,
    createClaim: mock.createClaim,
    burnGasNFT: mock.burnGasNFT,
    swap: mock.swap,
    getEntangledPair: live.getEntangledPair,
  };
}
