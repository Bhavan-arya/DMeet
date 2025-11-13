import React, { useRef } from 'react';
import { HangUpIcon, ShareScreenIcon, StopScreenShareIcon, MicOnIcon, MicOffIcon, VideoOnIcon, VideoOffIcon, ChatIcon } from './Icons';

interface CallControlsProps {
    onHangUp: () => void;
    onShareMedia: (file: File) => void;
    onStopSharingMedia: () => void;
    isSharingMedia: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    onToggleChat: () => void;
    isChatVisible: boolean;
}

export const CallControls: React.FC<CallControlsProps> = ({ 
    onHangUp, 
    onShareMedia, 
    onStopSharingMedia, 
    isSharingMedia,
    onToggleAudio,
    onToggleVideo,
    isAudioMuted,
    isVideoMuted,
    onToggleChat,
    isChatVisible,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleShareClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onShareMedia(file);
        }
    };

    return (
        <div className="bg-gray-800/70 backdrop-blur-md p-3 rounded-full flex items-center justify-center gap-4 shadow-lg">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="video/*,audio/*"
            />
            
            <button 
                onClick={onToggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={isAudioMuted ? "Unmute" : "Mute"}
            >
                {isAudioMuted ? <MicOffIcon className="w-6 h-6 text-white" /> : <MicOnIcon className="w-6 h-6 text-white" />}
            </button>

            <button 
                onClick={onToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={isVideoMuted ? "Turn Video On" : "Turn Video Off"}
            >
                {isVideoMuted ? <VideoOffIcon className="w-6 h-6 text-white" /> : <VideoOnIcon className="w-6 h-6 text-white" />}
            </button>

            {isSharingMedia ? (
                 <button 
                    onClick={onStopSharingMedia} 
                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                    title="Stop Sharing Media"
                 >
                    <StopScreenShareIcon className="w-6 h-6 text-white" />
                 </button>
            ) : (
                <button 
                    onClick={handleShareClick} 
                    className="w-12 h-12 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
                    title="Share Media"
                >
                    <ShareScreenIcon className="w-6 h-6 text-white" />
                </button>
            )}
            
            <button 
                onClick={onToggleChat}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isChatVisible ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={isChatVisible ? "Hide Chat" : "Show Chat"}
            >
                <ChatIcon className="w-6 h-6 text-white" />
            </button>

            <button 
                onClick={onHangUp} 
                className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                title="Hang Up"
            >
                <HangUpIcon className="w-6 h-6 text-white" />
            </button>
        </div>
    );
};