import { StateCreator } from 'zustand';
import { type Track } from '@/lib/mockData/tracks';

export interface RadRadioSlice {
  // State
  radioCurrentVideoIndex: number;
  radioCurrentTrackIndex: number;
  radioCurrentChannel: Track['channel'];
  radioIsPlaying: boolean;
  radioCurrentTime: number;
  radioFavorites: string[];

  // Actions
  radioNextVideo: (videoCount: number) => void;
  radioPrevVideo: (videoCount: number) => void;
  radioSetVideoIndex: (index: number) => void;
  radioNextTrack: (trackCount: number) => void;
  radioPrevTrack: (trackCount: number) => void;
  radioSetTrackIndex: (index: number) => void;
  radioSetChannel: (channel: Track['channel']) => void;
  radioTogglePlay: () => void;
  radioSetPlaying: (playing: boolean) => void;
  radioSetCurrentTime: (time: number) => void;
  radioPendingSeek: number | null;
  radioSeekTo: (time: number) => void;
  radioClearPendingSeek: () => void;
  radioToggleFavorite: (trackId: string) => void;
  radioMinified: boolean;
  radioToggleMinified: () => void;

  radioSlow: number;
  radioReverb: number;
  radioSetSlow: (v: number) => void;
  radioSetReverb: (v: number) => void;

  /** Dropdown widget panel (session-only, not persisted). */
  radioWidgetOpen: boolean;
  radioToggleWidget: () => void;
  radioSetWidgetOpen: (open: boolean) => void;
}

export const createRadRadioSlice: StateCreator<RadRadioSlice, [], [], RadRadioSlice> = (
  set,
) => ({
  radioCurrentVideoIndex: 0,
  radioCurrentTrackIndex: 0,
  radioCurrentChannel: 'kemosabe',
  radioIsPlaying: false,
  radioCurrentTime: 0,
  radioFavorites: [],

  radioNextVideo: (videoCount) => {
    set((state) => ({
      radioCurrentVideoIndex:
        state.radioCurrentVideoIndex < videoCount - 1
          ? state.radioCurrentVideoIndex + 1
          : 0,
    }));
  },

  radioPrevVideo: (videoCount) => {
    set((state) => ({
      radioCurrentVideoIndex:
        state.radioCurrentVideoIndex > 0
          ? state.radioCurrentVideoIndex - 1
          : videoCount - 1,
    }));
  },

  radioSetVideoIndex: (index) => {
    set({ radioCurrentVideoIndex: index });
  },

  radioNextTrack: (trackCount) => {
    set((state) => ({
      radioCurrentTrackIndex:
        state.radioCurrentTrackIndex < trackCount - 1
          ? state.radioCurrentTrackIndex + 1
          : 0,
      radioCurrentTime: 0,
    }));
  },

  radioPrevTrack: (trackCount) => {
    set((state) => ({
      radioCurrentTrackIndex:
        state.radioCurrentTrackIndex > 0
          ? state.radioCurrentTrackIndex - 1
          : trackCount - 1,
      radioCurrentTime: 0,
    }));
  },

  radioSetTrackIndex: (index) => {
    set({ radioCurrentTrackIndex: index, radioCurrentTime: 0 });
  },

  radioSetChannel: (channel) => {
    set({
      radioCurrentChannel: channel,
      radioCurrentTrackIndex: 0,
      radioCurrentTime: 0,
      radioIsPlaying: false,
    });
  },

  radioTogglePlay: () => {
    set((state) => ({ radioIsPlaying: !state.radioIsPlaying }));
  },

  radioSetPlaying: (playing) => {
    set({ radioIsPlaying: playing });
  },

  radioSetCurrentTime: (time) => {
    set({ radioCurrentTime: time });
  },

  radioPendingSeek: null,

  radioSeekTo: (time) => {
    set({ radioPendingSeek: time, radioCurrentTime: time });
  },

  radioClearPendingSeek: () => {
    set({ radioPendingSeek: null });
  },

  radioToggleFavorite: (trackId) => {
    set((state) => {
      const favSet = new Set(state.radioFavorites);
      if (favSet.has(trackId)) {
        favSet.delete(trackId);
      } else {
        favSet.add(trackId);
      }
      return { radioFavorites: [...favSet] };
    });
  },

  radioMinified: false,
  radioToggleMinified: () => {
    set((state) => ({ radioMinified: !state.radioMinified }));
  },

  radioSlow: 0,
  radioReverb: 0,
  radioSetSlow: (v) => set({ radioSlow: Math.max(0, Math.min(1, v)) }),
  radioSetReverb: (v) => set({ radioReverb: Math.max(0, Math.min(1, v)) }),

  radioWidgetOpen: false,
  radioToggleWidget: () => set((s) => ({ radioWidgetOpen: !s.radioWidgetOpen })),
  radioSetWidgetOpen: (open) => set({ radioWidgetOpen: open }),
});
