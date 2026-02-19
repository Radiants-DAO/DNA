'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePreferencesStore, useWalletStore } from '@/store';
import {
  mockTracks,
  getTracksByChannel,
  type Track,
} from '@/lib/mockData/tracks';
import { AppProps } from '@/lib/constants';
import type { SeekerTab } from './types';
import { PhoneStatusBar } from './components/PhoneStatusBar';
import { AppHeader } from './components/AppHeader';
import { MiniPlayer } from './components/MiniPlayer';
import { SeekerBottomNav } from './components/SeekerBottomNav';
import { InfoTab } from './components/InfoTab';
import { MusicTab } from './components/MusicTab';
import { ChatTab } from './components/ChatTab';
import { CameraTab } from './components/CameraTab';

const TAB_TITLES: Record<SeekerTab, string> = {
  info: 'NEWSROOM',
  music: 'RAD RADIO',
  chat: 'RADIMUS',
  camera: 'CAMERA',
};

export function SeekerApp({ windowId }: AppProps) {
  const { volume, setVolume } = usePreferencesStore();
  const { isWalletConnected, ownedRadiants } = useWalletStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<SeekerTab>('info');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const channelTracks = getTracksByChannel('kemosabe');
  const currentTrack: Track = channelTracks[currentTrackIndex] || mockTracks[0];

  // Sync volume with store
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Load track when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrack.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time update + track end listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setCurrentTrackIndex((prev) =>
        prev < channelTracks.length - 1 ? prev + 1 : 0
      );
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [channelTracks.length]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) =>
      prev > 0 ? prev - 1 : channelTracks.length - 1
    );
    setCurrentTime(0);
  }, [channelTracks.length]);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) =>
      prev < channelTracks.length - 1 ? prev + 1 : 0
    );
    setCurrentTime(0);
  }, [channelTracks.length]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const goToMusic = useCallback(() => setActiveTab('music'), []);

  return (
    <div className="h-full bg-[#0A0A0A] flex flex-col overflow-hidden text-cream">
      {/* Hoisted audio element */}
      <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />

      <PhoneStatusBar />
      <AppHeader title={TAB_TITLES[activeTab]} />

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'info' && <InfoTab />}
        {activeTab === 'music' && (
          <MusicTab
            audioRef={audioRef}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            volume={volume}
            onPlayPause={togglePlay}
            onPrev={prevTrack}
            onNext={nextTrack}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            isWalletConnected={isWalletConnected}
            hasRadiant={ownedRadiants.length > 0}
          />
        )}
        {activeTab === 'camera' && <CameraTab />}
      </div>

      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onPrev={prevTrack}
        onNext={nextTrack}
        onGoToMusic={goToMusic}
      />
      <SeekerBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default SeekerApp;
