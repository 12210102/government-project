import { useRef, useState, useCallback, useEffect } from 'react';

export function useCctvStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectStream = useCallback(async (url: string) => {
    setError(null);
    setLoading(true);

    try {
      if (url.includes('.m3u8') || url.includes('m3u8')) {
        // HLS streams need hls.js — but we can't install it, so try native HLS (Safari)
        if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = url;
          await videoRef.current.play();
          setIsActive(true);
        } else {
          setError('HLS streams require Safari or an HLS player. Try an MJPEG or direct video URL.');
        }
      } else {
        // Direct video URL or MJPEG stream
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.loop = true;
          await videoRef.current.play();
          setIsActive(true);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to CCTV stream';
      setError(message);
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
      }
    };
  }, []);

  return { videoRef, isActive, error, loading, connectStream, disconnect };
}
