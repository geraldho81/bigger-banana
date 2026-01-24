'use client';

import { useRef, useState } from 'react';
import { Download, Maximize2, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import type { VideoGenerationResult } from '@/lib/types';

interface VideoPlayerProps {
  result: VideoGenerationResult;
}

export function VideoPlayer({ result }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoSrc = result.videoUrl || (result.videoData ? `data:${result.mimeType};base64,${result.videoData}` : '');

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handleDownload = () => {
    if (!videoSrc) return;

    const link = document.createElement('a');
    link.href = videoSrc;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!videoSrc) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-bg-secondary text-text-muted">
        No video available
      </div>
    );
  }

  return (
    <div className="image-frame group relative">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full rounded-2xl"
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="rounded-full bg-accent-gold/20 p-2 text-accent-gold transition-colors hover:bg-accent-gold/30"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          {result.hasAudio && (
            <button
              onClick={toggleMute}
              className="rounded-full bg-accent-gold/20 p-2 text-accent-gold transition-colors hover:bg-accent-gold/30"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-full bg-accent-gold/20 p-2 text-accent-gold transition-colors hover:bg-accent-gold/30"
            title="Download video"
          >
            <Download className="h-5 w-5" />
          </button>

          <button
            onClick={handleFullscreen}
            className="rounded-full bg-accent-gold/20 p-2 text-accent-gold transition-colors hover:bg-accent-gold/30"
            title="Fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={togglePlay}
        >
          <div className="rounded-full bg-accent-gold/30 p-4 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-12 w-12 text-accent-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
