// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

interface IntroVideoProps {
  onComplete?: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasUserInteracted) return;

    // Listen for YouTube player messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = JSON.parse(event.data);

        if (data.event === 'onStateChange') {
          if (data.info === 1) { // PLAYING
            setIsPlaying(true);
            setError(null);
          } else if (data.info === 0) { // ENDED
            onComplete?.();
          } else if (data.info === -1) { // UNSTARTED
            // Video is ready but not playing yet
            setError(null);
          }
        } else if (data.event === 'onReady') {
          // Player is ready, try to play
          setTimeout(() => {
            if (iframeRef.current) {
              // Try to simulate a click to enable autoplay
              iframeRef.current.contentWindow?.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                '*'
              );
            }
          }, 100);
        } else if (data.event === 'onError') {
          setError(`YouTube error: ${data.info}`);
          console.error('YouTube player error:', data.info);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);

    // Try to start playing after a delay
    const playTimer = setTimeout(() => {
      if (iframeRef.current && !isPlaying) {
        try {
          iframeRef.current.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            '*'
          );
        } catch (e) {
          console.log('Could not send play command:', e);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(playTimer);
    };
  }, [hasUserInteracted, isPlaying, onComplete]);

  const startVideo = () => {
    setHasUserInteracted(true);
    setError(null);
  };

  const getIframeSrc = () => {
    const baseUrl = 'https://www.youtube.com/embed/0LrDZBcSqoo';
    const params = new URLSearchParams({
      autoplay: '1',
      controls: '0',
      disablekb: '1',
      fs: '0',
      iv_load_policy: '3',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      mute: '0', // Start with sound
      enablejsapi: '1',
      origin: window.location.origin,
      playsinline: '1'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  if (!hasUserInteracted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center max-w-md mx-4">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Quantum Image Classroom</h2>
            <p className="text-gray-300 text-lg">Click below to start your learning journey</p>
          </div>

          <button
            onClick={startVideo}
            className="bg-red-600 hover:bg-red-700 text-white text-2xl font-bold px-12 py-6 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            ▶ START INTRO
          </button>

          <p className="text-gray-400 text-sm mt-4">
            Video will play with sound • Click "Skip Intro" to jump to games
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={getIframeSrc()}
        className="w-screen h-screen absolute inset-0"
        frameBorder="0"
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        title="Intro Video"
      />

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onComplete}
          className="bg-black/70 text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
        >
          Skip Intro
        </button>
      </div>

      {/* Loading/Error indicator
      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading video...</div>
          </div>
        </div>
      )} */}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/80">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-lg mb-4">Video failed to load</div>
            <div className="text-sm text-gray-300 mb-4">{error}</div>
            <button
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Continue to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}