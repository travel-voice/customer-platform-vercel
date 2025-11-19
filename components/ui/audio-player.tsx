"use client";

import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useMemo,useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = '' }: AudioPlayerProps) {
  // Use useMemo to create Audio object like the original implementation
  const audio = useMemo(() => new Audio(src), [src]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if URL is valid
  if (!src || src.trim() === '') {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <span className="text-sm text-yellow-600 dark:text-yellow-400">
          No audio URL provided
        </span>
      </div>
    );
  }

  useEffect(() => {
    // Debug logging
    console.log('AudioPlayer: Loading audio from URL:', src);

    const handleLoadedMetadata = () => {
      console.log('AudioPlayer: Metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
    };
    
    const handleLoadStart = () => {
      console.log('AudioPlayer: Load started');
      setIsLoading(true);
      setHasError(false);
    };
    
    const handleCanPlay = () => {
      console.log('AudioPlayer: Can play');
      setIsLoading(false);
      setHasError(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const handleError = (e: Event) => {
      console.error('AudioPlayer: Error loading audio:', e, audio.error);
      setIsLoading(false);
      setHasError(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      // Cleanup interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Pause audio and cleanup
      audio.pause();
    };
  }, [audio, src]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audio.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      
      // Custom progress tracking like the original implementation
      intervalRef.current = setInterval(() => {
        setCurrentTime(audio.currentTime);
      }, 100);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      audio.volume = volume > 0 ? volume : 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <span className="text-sm text-red-600 dark:text-red-400">
          Unable to load audio recording
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-pulse flex space-x-2 items-center">
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          <div className="h-2 w-32 bg-gray-300 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      {/* Audio object is created via useMemo, no need for audio element */}
      
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Time Display */}
      <span className="text-sm text-muted-foreground flex-shrink-0 min-w-[4rem]">
        {formatTime(currentTime)}
      </span>

      {/* Progress Slider */}
      <div className="flex-1 mx-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
        />
      </div>

      {/* Duration */}
      <span className="text-sm text-muted-foreground flex-shrink-0 min-w-[4rem]">
        {formatTime(duration)}
      </span>

      {/* Volume Controls */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="p-1"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        
        <div className="w-16">
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
} 