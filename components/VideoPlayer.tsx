
import React, { useRef, useEffect, PropsWithChildren } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
}

export const VideoPlayer: React.FC<PropsWithChildren<VideoPlayerProps>> = ({ stream, muted = false, children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-contain"
        />
        {children}
    </div>
  );
};
