// Mock tracks data for the Rad Radio app

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl: string;
  audioUrl: string;
  channel: 'kemosabe'; // Artist-based channels
}

export interface Channel {
  id: Track['channel'];
  name: string;
  description: string;
}

// Artist-based channels
export const channels: Channel[] = [
  {
    id: 'kemosabe',
    name: 'KEMOSABE',
    description: 'Beats by KEMOSABE',
  },
];

// Actual audio files from /public/media/music/
export const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'DAWN',
    artist: 'KEMOSABE',
    album: '10-7 Sessions',
    duration: 180,
    coverUrl: '/assets/audio/covers/placeholder.png',
    audioUrl: '/media/music/10-7 DAWN.mp3',
    channel: 'kemosabe',
  },
  {
    id: 'track-2',
    title: 'Aliens',
    artist: 'KEMOSABE',
    album: '9-13 Sessions',
    duration: 210,
    coverUrl: '/assets/audio/covers/placeholder.png',
    audioUrl: '/media/music/9-13 Aliens.mp3',
    channel: 'kemosabe',
  },
  {
    id: 'track-3',
    title: 'Space n Time',
    artist: 'KEMOSABE',
    album: '9-3 Sessions',
    duration: 240,
    coverUrl: '/assets/audio/covers/placeholder.png',
    audioUrl: '/media/music/9-3 SpacenTime.mp3',
    channel: 'kemosabe',
  },
];

export function getTracksByChannel(channelId: Track['channel']): Track[] {
  return mockTracks.filter((track) => track.channel === channelId);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
