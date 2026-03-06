import { StateCreator } from 'zustand';

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
  radiants: Radiant[];
  studioSubmissions: StudioSubmission[];

  // Actions
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
  radiants: [],
  studioSubmissions: [],

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
