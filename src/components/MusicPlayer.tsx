'use client';

import React, { useEffect, useState, useRef } from 'react';
import { YouTubeTrack } from '@/lib/youtube';

interface MusicPlayerProps {
  track: YouTubeTrack | null;
  onClose: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && track) {
      initializePlayer();
    }
  }, [isReady, track]);

  const initializePlayer = () => {
    if (!track || !playerContainerRef.current) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const containerId = 'youtube-player-' + track.id;
    playerContainerRef.current.innerHTML = `<div id="${containerId}"></div>`;

    playerRef.current = new window.YT.Player(containerId, {
      height: '80',
      width: '100%',
      videoId: track.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume);
          event.target.playVideo();
          setDuration(event.target.getDuration());
          startTimeUpdate();
          setIsPlaying(true);
        },
        onStateChange: (event: any) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
        }
      }
    });
  };

  const startTimeUpdate = () => {
    const updateTime = () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
      if (isPlaying) {
        requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#010101] via-[#010101]/95 to-transparent backdrop-blur-xl text-white shadow-2xl border-t border-yellow-300/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* İlerleme çubuğu */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-300/5">
          <div 
            className="h-full bg-gradient-to-r from-yellow-300/80 to-yellow-500/80"
            style={{ width: `${(currentTime / duration) * 100}%`, transition: 'width 0.1s linear' }}
          />
        </div>

        <div className="flex items-center gap-6">
          {/* Şarkı Bilgisi */}
          <div className="flex items-center gap-4 min-w-[240px] max-w-[240px]">
            <div className="relative group">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-14 h-14 rounded-xl object-cover shadow-lg group-hover:shadow-yellow-300/20 transition-all"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-xl transition-colors" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-base text-yellow-300 truncate group-hover:text-yellow-400 transition-colors">
                {track.title}
              </h3>
              <p className="text-sm text-yellow-300/50 truncate">{track.artist}</p>
            </div>
          </div>

          {/* Player Kontrolleri */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <div ref={playerContainerRef} className="h-0 overflow-hidden" />
            
            {/* Kontroller */}
            <div className="flex items-center gap-6">
              {/* Geri Sarma */}
              <button
                onClick={() => playerRef.current?.seekTo(Math.max(0, currentTime - 10), true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-300/10 text-yellow-300/70 hover:text-yellow-300 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5 3L4 10l8.5 7V3zm7 0L12 10l7.5 7V3z"/>
                </svg>
              </button>

              {/* Oynat/Duraklat */}
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-300 hover:bg-yellow-400 text-[#010101] transition-all shadow-lg hover:shadow-yellow-300/25"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* İleri Sarma */}
              <button
                onClick={() => playerRef.current?.seekTo(Math.min(duration, currentTime + 10), true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-300/10 text-yellow-300/70 hover:text-yellow-300 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5 3l8.5 7-8.5 7V3zm-7 0L13 10l-8.5 7V3z"/>
                </svg>
              </button>
            </div>

            {/* Zaman Çubuğu */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <span className="text-xs font-medium text-yellow-300/50 min-w-[40px] text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 group">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="w-full h-1 bg-yellow-300/10 rounded-full appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-300
                    [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100
                    transition-all"
                />
                <div 
                  className="absolute left-0 top-1/2 h-1 bg-yellow-300/30 rounded-full -translate-y-1/2 pointer-events-none
                    group-hover:bg-yellow-300/50 transition-colors"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-yellow-300/50 min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Ses Kontrolü ve Kapat */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVolumeChange({ target: { value: volume === 0 ? 100 : 0 } } as any)}
                className="text-yellow-300/70 hover:text-yellow-300 transition-colors"
              >
                {volume === 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3 3v-3.46L13.21 17.7a7.277 7.277 0 01-1.21.8v2.01c.47-.17.92-.39 1.34-.66l2.03 2.03a.996.996 0 101.41-1.41L5.05 3.63a.996.996 0 00-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-7-8l-1.88 1.88L12 7.76zm4.5 8c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-yellow-300/10 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-300"
              />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-300/10 text-yellow-300/70 hover:text-yellow-300 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer; 