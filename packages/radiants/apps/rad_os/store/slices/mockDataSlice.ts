import { StateCreator } from 'zustand';

// Placeholder interfaces - will be expanded in Phase 4
export interface Auction {
  auctionId: string;
  version: 'v1' | 'v2';
  metadata: {
    name: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  };
  account: {
    startTimestamp: number;
    endTimestamp: number;
    winner: string | null;
    highestBidder: string | null;
    isClaimed: boolean;
  };
}

export interface Radiant {
  id: string;
  name: string;
  image: string;
  owner: string;
}

export interface StudioSubmission {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  createdAt: number;
}

export interface MockDataSlice {
  // State
  auctions: Auction[];
  radiants: Radiant[];
  studioSubmissions: StudioSubmission[];

  // Actions
  setAuctions: (auctions: Auction[]) => void;
  setRadiants: (radiants: Radiant[]) => void;
  setStudioSubmissions: (submissions: StudioSubmission[]) => void;
  addStudioSubmission: (submission: StudioSubmission) => void;
  updateSubmissionVotes: (
    id: string,
    votes: { upvotes?: number; downvotes?: number }
  ) => void;
}

export const createMockDataSlice: StateCreator<
  MockDataSlice,
  [],
  [],
  MockDataSlice
> = (set) => ({
  auctions: [],
  radiants: [],
  studioSubmissions: [],

  setAuctions: (auctions) => set({ auctions }),

  setRadiants: (radiants) => set({ radiants }),

  setStudioSubmissions: (studioSubmissions) => set({ studioSubmissions }),

  addStudioSubmission: (submission) =>
    set((state) => ({
      studioSubmissions: [...state.studioSubmissions, submission],
    })),

  updateSubmissionVotes: (id, votes) =>
    set((state) => ({
      studioSubmissions: state.studioSubmissions.map((s) => {
        if (s.id !== id) return s;
        const upvotes = votes.upvotes ?? s.upvotes;
        const downvotes = votes.downvotes ?? s.downvotes;
        return {
          ...s,
          upvotes,
          downvotes,
          netVotes: upvotes - downvotes,
        };
      }),
    })),
});
