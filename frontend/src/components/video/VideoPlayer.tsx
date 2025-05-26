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
// import { formatDuration } from 'date-fns'; // date-fns tidak memiliki formatDuration, Anda mungkin perlu helper kustom

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  duration?: number; // Jika Anda tidak memberikan ini, pastikan video.duration terisi dengan benar
  chapters?: Chapter[];
  subtitles?: SubtitleTrack[];
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  onBookmark?: (time: number) => void;
  autoPlay?: boolean;
  startTime?: number;
  className?: string;
  showControls?: boolean; // Prop untuk mengaktifkan/menonaktifkan kontrol secara keseluruhan
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

// Helper kustom untuk formatDuration jika tidak menggunakan library eksternal
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};


const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  description,
  // duration, // duration prop is available if needed
  chapters = [],
  subtitles = [],
  onProgress,
  onComplete,
  onBookmark,
  autoPlay = false,
  startTime = 0,
  className = '',
  showControls = true, // Prop, bukan state
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
  // Mengganti nama state agar tidak konflik dengan prop 'showControls'
  const [isControlsActuallyVisible, setIsControlsActuallyVisible] = useState(true);
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
      video.play().catch(error => {
        console.error("Autoplay failed:", error);
        // Autoplay bisa gagal karena kebijakan browser, mungkin perlu interaksi pengguna
      });
    }
  }, [startTime, autoPlay]);

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVideoProgress = () => {
      const currentTime = video.currentTime;
      const videoDuration = video.duration || 0;
      const bufferedTime = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0;
      const playedPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

      const newProgressData = {
        currentTime,
        duration: videoDuration,
        buffered: bufferedTime,
        played: playedPercentage
      };

      setProgress(newProgressData);
      onProgress?.(playedPercentage, currentTime);

      const currentChapter = chapters.find(
        chapter => currentTime >= chapter.startTime && currentTime < chapter.endTime
      );
      setActiveChapter(currentChapter || null);
    };

    const handleLoadedMetadata = () => {
      updateVideoProgress(); // Update duration saat metadata dimuat
    };

    const handleTimeUpdate = () => {
      updateVideoProgress();
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

    // Set subtitle default
    const defaultTrack = subtitles.find(track => track.default);
    if (defaultTrack && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].language === defaultTrack.language && video.textTracks[i].label === defaultTrack.label) {
          video.textTracks[i].mode = 'showing';
          setSelectedSubtitle(defaultTrack.id);
          break;
        }
      }
    }


    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [chapters, onProgress, onComplete, subtitles]);

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
    // Hanya sembunyikan jika kontrol diizinkan oleh prop 'showControls'
    if (isPlaying && showControls && isControlsActuallyVisible) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsActuallyVisible(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, isControlsActuallyVisible]);

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
    if (video.muted) setVolume(0); // Set volume slider ke 0 jika mute
    else if (volume === 0) setVolume(0.1); // Jika unmute dan volume 0, set ke nilai kecil
  }, [volume]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    video.muted = newVolume === 0; // Mute jika volume 0
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((seekTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const duration = video.duration;
    if (isNaN(duration)) return; // Jangan seek jika durasi belum diketahui

    video.currentTime = Math.max(0, Math.min(seekTime, duration));
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video || isNaN(video.duration)) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const seekTime = (clickX / progressWidth) * video.duration;

    handleSeek(seekTime);
  }, [handleSeek]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;

    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!allowFullscreen) return;
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
  }, [allowFullscreen]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleSubtitleChange = useCallback((trackId: string) => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;

    setSelectedSubtitle(trackId);
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      const currentSub = subtitles.find(sub => sub.id === trackId);
      if (currentSub && track.label === currentSub.label && track.language === currentSub.language) {
        track.mode = 'showing';
      } else {
        track.mode = 'hidden';
      }
    }
    if (trackId === "") { // "Off" selected
        for (let i = 0; i < video.textTracks.length; i++) {
            video.textTracks[i].mode = 'hidden';
        }
    }
  }, [subtitles]);


  const handleChapterClick = useCallback((chapter: Chapter) => {
    handleSeek(chapter.startTime);
    setShowChapters(false); // Sembunyikan panel chapter setelah diklik
  }, [handleSeek]);

  const addBookmark = useCallback(() => {
    const currentTime = progress.currentTime;
    if (!bookmarks.includes(currentTime)) {
      setBookmarks(prev => [...prev, currentTime].sort((a, b) => a - b));
      onBookmark?.(currentTime);
    }
  }, [progress.currentTime, bookmarks, onBookmark]);

  const handleControlsVisibility = () => {
    if (showControls) { // Hanya tampilkan jika prop 'showControls' true
      setIsControlsActuallyVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Atur timeout lagi jika video sedang diputar
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsActuallyVisible(false);
        }, 3000);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={handleControlsVisibility}
      onMouseLeave={() => {
        if (isPlaying && showControls) { // Hanya sembunyikan jika kontrol diizinkan dan video diputar
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => setIsControlsActuallyVisible(false), 500); // delay kecil
        }
      }}
      onFocus={handleControlsVisibility} // Untuk aksesibilitas keyboard
      tabIndex={0} // Membuat div bisa difokus
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay} // Klik pada video juga toggle play/pause
        onDoubleClick={allowFullscreen ? toggleFullscreen : undefined} // Double click untuk fullscreen
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
        <div className="absolute top-4 right-4 text-white/50 text-sm font-medium pointer-events-none select-none">
          {watermark}
        </div>
      )}

      {/* Loading State */}
      {progress.duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
            aria-label="Play video"
          >
            <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
              <PlayIcon className="w-12 h-12 text-gray-900 ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Container */}
      {/* Tampilkan kontrol jika prop showControls true DAN state isControlsActuallyVisible true ATAU video tidak sedang diputar (selalu tampilkan kontrol saat pause) */}
      <AnimatePresence>
        {showControls && (isControlsActuallyVisible || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
            // Hentikan event klik pada kontainer kontrol agar tidak toggle play/pause video
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div
              ref={progressRef}
              className="relative h-2 bg-white/20 rounded-full mb-4 cursor-pointer group/progress" // Grouping for hover effects
              onClick={handleProgressClick}
              role="slider"
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={progress.duration}
              aria-valuenow={progress.currentTime}
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
              {/* Scrubber (Thumb) */}
              <div
                className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full transform -translate-y-1/3 -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `${progress.played}%`, top: '50%' }}
              />
              {/* Bookmarks on Progress Bar */}
              {bookmarks.map(bookmarkTime => (
                <div
                  key={`bookmark-indicator-${bookmarkTime}`}
                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full transform -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${(bookmarkTime / progress.duration) * 100}%`, top: '50%' }}
                  title={`Bookmark at ${formatTime(bookmarkTime)}`}
                />
              ))}
              {/* Chapters on Progress Bar */}
              {chapters.map(chapter => (
                <div
                  key={`chapter-indicator-${chapter.id}`}
                  className="absolute w-0.5 h-3 bg-white/70 transform -translate-y-1/2"
                  style={{ left: `${(chapter.startTime / progress.duration) * 100}%`, top: '50%' }}
                  title={chapter.title}
                />
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center space-x-3 md:space-x-4">
                <button onClick={togglePlay} className="hover:text-blue-400 transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <button onClick={() => skip(-10)} className="hover:text-blue-400 transition-colors hidden sm:block" aria-label="Rewind 10 seconds">
                  <BackwardIcon className="w-5 h-5" />
                </button>
                <button onClick={() => skip(10)} className="hover:text-blue-400 transition-colors hidden sm:block" aria-label="Forward 10 seconds">
                  <ForwardIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="hover:text-blue-400 transition-colors" aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}>
                    {isMuted || volume === 0 ?
                      <SpeakerXMarkIcon className="w-5 h-5" /> :
                      <SpeakerWaveIcon className="w-5 h-5" />
                    }
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01} // Step lebih halus
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-12 md:w-20 h-1 bg-white/20 rounded-full appearance-none slider [&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:bg-blue-500"
                    aria-label="Volume control"
                  />
                </div>
                <span className="text-xs md:text-sm font-medium select-none">
                  {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <button onClick={addBookmark} className="hover:text-yellow-400 transition-colors" aria-label="Add bookmark">
                  <BookmarkIcon className="w-5 h-5" />
                </button>
                {chapters.length > 0 && (
                  <button
                    onClick={() => { setShowChapters(!showChapters); setShowSettings(false); }}
                    className={`transition-colors ${showChapters ? 'text-blue-400' : 'hover:text-blue-400'}`}
                    aria-label="Show chapters"
                    aria-expanded={showChapters}
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowChapters(false); }}
                  className={`transition-colors ${showSettings ? 'text-blue-400' : 'hover:text-blue-400'}`}
                  aria-label="Video settings"
                  aria-expanded={showSettings}
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                {allowFullscreen && (
                  <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors" aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
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
            transition={{ duration: 0.2 }}
            className="absolute bottom-[calc(4rem+1rem)] right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-[180px] shadow-lg z-10"
            onClick={(e) => e.stopPropagation()} // Agar klik di panel tidak menutupnya
          >
            <div className="space-y-3">
              <div>
                <label htmlFor="playbackRateSelect" className="block text-sm font-medium mb-1">Playback Speed</label>
                <select
                  id="playbackRateSelect"
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <option key={rate} value={rate}>{rate}x</option>
                  ))}
                </select>
              </div>
              {subtitles.length > 0 && (
                <div>
                  <label htmlFor="subtitlesSelect" className="block text-sm font-medium mb-1">Subtitles</label>
                  <select
                    id="subtitlesSelect"
                    value={selectedSubtitle}
                    onChange={(e) => handleSubtitleChange(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Off</option>
                    {subtitles.map(track => (
                      <option key={track.id} value={track.id}>
                        {track.label} ({track.language})
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
            transition={{ duration: 0.2 }}
            className="absolute bottom-[calc(4rem+1rem)] left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs shadow-lg z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3 text-base">Chapters</h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
              {chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className={`
                    w-full text-left p-2.5 rounded hover:bg-white/10 transition-colors text-sm
                    ${activeChapter?.id === chapter.id ? 'bg-blue-500/30 border border-blue-500/60' : 'border border-transparent'}
                  `}
                >
                  <div className="font-medium">{chapter.title}</div>
                  <div className="text-xs text-gray-300">
                    {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                  </div>
                  {chapter.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {chapter.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Title & Description Overlay */}
      {title && isControlsActuallyVisible && ( // Tampilkan judul hanya jika kontrol terlihat atau video dijeda
        <div className="absolute top-4 left-4 text-white pointer-events-none max-w-[calc(100%-8rem)] select-none">
          <h2 className="font-semibold text-lg truncate">{title}</h2>
          {description && (
            <p className="text-sm text-white/80 mt-0.5 truncate">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;