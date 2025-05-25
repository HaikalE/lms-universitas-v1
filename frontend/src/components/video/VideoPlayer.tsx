import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  ForwardIcon,
  BackwardIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from 'date-fns';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  duration?: number;
  chapters?: Chapter[];
  subtitles?: SubtitleTrack[];
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  onBookmark?: (time: number) => void;
  autoPlay?: boolean;
  startTime?: number;
  className?: string;
  showControls?: boolean;
  allowFullscreen?: boolean;
  allowDownload?: boolean;
  watermark?: string;
}

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  default?: boolean;
}

interface VideoProgress {
  currentTime: number;
  duration: number;
  buffered: number;
  played: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  description,
  duration,
  chapters = [],
  subtitles = [],
  onProgress,
  onComplete,
  onBookmark,
  autoPlay = false,
  startTime = 0,
  className = '',
  showControls = true,
  allowFullscreen = true,
  allowDownload = false,
  watermark
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState<VideoProgress>({
    currentTime: 0,
    duration: 0,
    buffered: 0,
    played: 0
  });
  const [showControls, setShowControlsVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (startTime > 0) {
      video.currentTime = startTime;
    }

    if (autoPlay) {
      video.play().catch(console.error);
    }
  }, [startTime, autoPlay]);

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const currentTime = video.currentTime;
      const duration = video.duration || 0;
      const buffered = video.buffered.length > 0 ? video.buffered.end(0) : 0;
      const played = duration > 0 ? (currentTime / duration) * 100 : 0;

      const newProgress = {
        currentTime,
        duration,
        buffered,
        played
      };

      setProgress(newProgress);
      onProgress?.(played, currentTime);

      // Update active chapter
      const currentChapter = chapters.find(
        chapter => currentTime >= chapter.startTime && currentTime <= chapter.endTime
      );
      setActiveChapter(currentChapter || null);
    };

    const handleLoadedMetadata = () => {
      updateProgress();
    };

    const handleTimeUpdate = () => {
      updateProgress();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [chapters, onProgress, onComplete]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsVisible(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((seekTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = seekTime;
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const seekTime = (clickX / progressWidth) * video.duration;
    
    handleSeek(seekTime);
  }, [handleSeek]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleChapterClick = useCallback((chapter: Chapter) => {
    handleSeek(chapter.startTime);
    setShowChapters(false);
  }, [handleSeek]);

  const addBookmark = useCallback(() => {
    const currentTime = progress.currentTime;
    if (!bookmarks.includes(currentTime)) {
      setBookmarks(prev => [...prev, currentTime].sort((a, b) => a - b));
      onBookmark?.(currentTime);
    }
  }, [progress.currentTime, bookmarks, onBookmark]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const showControlsHandler = () => {
    setShowControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={showControlsHandler}
      onMouseEnter={showControlsHandler}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      >
        {subtitles.map(track => (
          <track
            key={track.id}
            kind="subtitles"
            src={track.src}
            srcLang={track.language}
            label={track.label}
            default={track.default}
          />
        ))}
      </video>

      {/* Watermark */}
      {watermark && (
        <div className="absolute top-4 right-4 text-white/50 text-sm font-medium pointer-events-none">
          {watermark}
        </div>
      )}

      {/* Loading State */}
      {progress.duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}

      {/* Play Button Overlay */}
      <AnimatePresence>
        {!isPlaying && progress.duration > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
              <PlayIcon className="w-12 h-12 text-gray-900 ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (showControlsVisible || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div
              ref={progressRef}
              className="relative h-2 bg-white/20 rounded-full mb-4 cursor-pointer group"
              onClick={handleProgressClick}
            >
              {/* Buffered */}
              <div
                className="absolute h-full bg-white/40 rounded-full"
                style={{ width: `${(progress.buffered / progress.duration) * 100}%` }}
              />
              
              {/* Played */}
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${progress.played}%` }}
              />
              
              {/* Scrubber */}
              <div
                className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress.played}%` }}
              />
              
              {/* Bookmarks */}
              {bookmarks.map(bookmark => (
                <div
                  key={bookmark}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2 -translate-x-1"
                  style={{ left: `${(bookmark / progress.duration) * 100}%` }}
                  title={`Bookmark at ${formatTime(bookmark)}`}
                />
              ))}
              
              {/* Chapters */}
              {chapters.map(chapter => (
                <div
                  key={chapter.id}
                  className="absolute w-1 h-4 bg-white/60 transform -translate-y-1"
                  style={{ left: `${(chapter.startTime / progress.duration) * 100}%` }}
                  title={chapter.title}
                />
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                  {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                
                {/* Skip buttons */}
                <button onClick={() => skip(-10)} className="hover:text-blue-400 transition-colors">
                  <BackwardIcon className="w-5 h-5" />
                </button>
                
                <button onClick={() => skip(10)} className="hover:text-blue-400 transition-colors">
                  <ForwardIcon className="w-5 h-5" />
                </button>
                
                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                    {isMuted || volume === 0 ? 
                      <SpeakerXMarkIcon className="w-5 h-5" /> : 
                      <SpeakerWaveIcon className="w-5 h-5" />
                    }
                  </button>
                  
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-full appearance-none slider"
                  />
                </div>
                
                {/* Time */}
                <span className="text-sm font-medium">
                  {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Bookmark */}
                <button onClick={addBookmark} className="hover:text-yellow-400 transition-colors">
                  <BookmarkIcon className="w-5 h-5" />
                </button>
                
                {/* Chapters */}
                {chapters.length > 0 && (
                  <button
                    onClick={() => setShowChapters(!showChapters)}
                    className="hover:text-blue-400 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                  </button>
                )}
                
                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                
                {/* Fullscreen */}
                {allowFullscreen && (
                  <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                    {isFullscreen ? 
                      <ArrowsPointingInIcon className="w-5 h-5" /> : 
                      <ArrowsPointingOutIcon className="w-5 h-5" />
                    }
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-20 right-4 bg-black/90 rounded-lg p-4 text-white min-w-48"
          >
            <div className="space-y-3">
              {/* Playback Speed */}
              <div>
                <label className="block text-sm font-medium mb-2">Playback Speed</label>
                <select
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              
              {/* Subtitles */}
              {subtitles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitles</label>
                  <select
                    value={selectedSubtitle}
                    onChange={(e) => setSelectedSubtitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Off</option>
                    {subtitles.map(track => (
                      <option key={track.id} value={track.id}>
                        {track.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapters Panel */}
      <AnimatePresence>
        {showChapters && chapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 bg-black/90 rounded-lg p-4 text-white max-w-sm"
          >
            <h3 className="font-medium mb-3">Chapters</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className={`
                    w-full text-left p-2 rounded hover:bg-white/10 transition-colors
                    ${activeChapter?.id === chapter.id ? 'bg-blue-500/20 border border-blue-500/50' : ''}
                  `}
                >
                  <div className="font-medium text-sm">{chapter.title}</div>
                  <div className="text-xs text-gray-300">
                    {formatTime(chapter.startTime)}
                  </div>
                  {chapter.description && (
                    <div className="text-xs text-gray-400 mt-1">
                      {chapter.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Title */}
      {title && (
        <div className="absolute top-4 left-4 text-white">
          <h2 className="font-semibold text-lg">{title}</h2>
          {description && (
            <p className="text-sm text-white/80 mt-1">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;