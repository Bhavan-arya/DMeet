import React, { useState, useEffect, useCallback } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoPlayer } from './components/VideoPlayer';
import { CallControls } from './components/CallControls';
import { SignalingManager } from './components/SignalingManager';
import { ChatPanel, Message } from './components/ChatPanel';
import { DiamondIcon, MicOffIcon, SpinnerIcon, WarningIcon, CloseIcon } from './components/Icons';

export type CallState = 'idle' | 'creating' | 'joining' | 'connected';

const ErrorBanner: React.FC<{ message: string, onDismiss: () => void }> = ({ message, onDismiss }) => (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white p-3 flex justify-between items-center z-50 rounded-lg shadow-lg w-11/12 max-w-2xl">
        <div className="flex items-center gap-3">
            <WarningIcon className="w-6 h-6" />
            <span>{message}</span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-red-500 transition-colors">
            <CloseIcon className="w-5 h-5" />
        </button>
    </div>
);

const ConnectionStatusOverlay: React.FC<{ status: RTCPeerConnectionState }> = ({ status }) => {
    if (status === 'connected') return null;

    let message = '';
    let showSpinner = false;

    // FIX: Removed invalid case 'checking'. 'checking' is part of RTCIceConnectionState, not RTCPeerConnectionState.
    switch (status) {
        case 'connecting':
            message = 'Connecting...';
            showSpinner = true;
            break;
        case 'disconnected':
            message = 'Connection lost. Attempting to reconnect...';
            showSpinner = true;
            break;
        case 'failed':
            message = 'Connection failed. Please hang up and try again.';
            break;
        case 'closed':
            message = 'Call ended.';
            break;
    }
    
    if (!message) return null;

    return (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 text-center p-4">
            {showSpinner && <SpinnerIcon className="w-12 h-12 text-white animate-spin mb-4" />}
            <p className="text-white text-xl font-semibold">{message}</p>
        </div>
    );
};


export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const handleNewChatMessage = useCallback((text: string) => {
      setMessages(prev => [...prev, { text, sender: 'remote', id: Date.now() }]);
  }, []);

  const {
    localStream,
    remoteStream,
    sharedMediaStream,
    isConnected,
    startLocalStream,
    createOffer,
    createAnswer,
    acceptAnswer,
    hangUp,
    shareMediaFile,
    stopSharingMedia,
    isSharingMedia,
    error,
    clearError,
    connectionState,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    remoteDisplayName,
    sendData,
  } = useWebRTC({ onChatMessage: handleNewChatMessage });

  const [callState, setCallState] = useState<CallState>('idle');
  const [displayName, setDisplayName] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (isConnected) {
      setCallState('connected');
    } else if (callState === 'connected' && ['closed', 'failed'].includes(connectionState)) {
      setCallState('idle');
    }
  }, [isConnected, callState, connectionState]);

  useEffect(() => {
    if (!isConnected) {
        return;
    }
    
    setCallDuration(0); 
    const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => {
        clearInterval(timer);
    };
  }, [isConnected]);

  useEffect(() => {
      if (isConnected && displayName) {
          sendData({ type: 'displayName', payload: displayName });
      }
  }, [isConnected, displayName, sendData]);
  
  const handleSendMessage = (text: string) => {
      if (!text.trim()) return;
      sendData({ type: 'chat', payload: text });
      setMessages(prev => [...prev, { text, sender: 'me', id: Date.now() }]);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    hangUp();
    setCallState('idle');
    setCallDuration(0);
    setMessages([]);
    setIsChatVisible(false);
  };
  
  const renderLobby = () => (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-2">
                <DiamondIcon className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Dmeet</h1>
            </div>
            <p className="text-lg text-gray-400">Share moments, watch together.</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-4 items-center">
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-700">
                        {localStream ? (
                            <VideoPlayer stream={localStream} muted={true} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                Your camera is off
                            </div>
                        )}
                    </div>
                     <button
                       onClick={() => startLocalStream()}
                       disabled={!!localStream}
                       className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           {localStream ? 'Camera On' : 'Turn On Camera & Mic'}
                       </button>
                </div>

                <div className="flex flex-col gap-4 min-h-[300px]">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="displayName" className="text-sm font-medium text-gray-400">Your Name</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name to continue"
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                     <SignalingManager 
                        startLocalStream={startLocalStream}
                        hasStream={!!localStream}
                        createOffer={createOffer}
                        createAnswer={createAnswer}
                        acceptAnswer={acceptAnswer}
                        isReady={!!localStream && !!displayName.trim()}
                     />
                </div>
            </div>
        </div>
    </div>
  );
  
  const renderCallView = () => (
    <div className="relative w-full h-full overflow-hidden">
        <div className={`absolute inset-0 bg-black flex items-center justify-center transition-all duration-300 ${isChatVisible ? 'pr-0 sm:pr-80' : 'pr-0'}`}>
            <VideoPlayer stream={sharedMediaStream || remoteStream} muted={false}>
                {remoteDisplayName && (
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-white text-lg">
                        {remoteDisplayName}
                    </div>
                )}
            </VideoPlayer>
            {!(sharedMediaStream || remoteStream) && connectionState !== 'connected' && (
                <div className="text-gray-400 text-2xl">Waiting for partner...</div>
            )}
        </div>
        
        <ConnectionStatusOverlay status={connectionState} />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-mono tracking-wider z-10">
            {formatDuration(callDuration)}
        </div>

        <div className={`absolute top-4 right-4 sm:right-auto sm:left-4 transition-all duration-300 ${isChatVisible ? 'sm:right-[21rem]' : 'sm:right-4'} w-32 h-auto sm:w-48 md:w-64 aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-cyan-500/50 z-10`}>
            <VideoPlayer stream={localStream} muted={true}>
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-md text-white text-sm">
                    {displayName || "You"}
                </div>
                {isAudioMuted && (
                    <div className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full">
                        <MicOffIcon className="w-4 h-4 text-white" />
                    </div>
                )}
            </VideoPlayer>
        </div>
        
        <ChatPanel 
            messages={messages} 
            isOpen={isChatVisible} 
            onClose={() => setIsChatVisible(false)}
            onSendMessage={handleSendMessage}
        />

        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 z-30">
           <CallControls 
                onHangUp={handleHangUp}
                onShareMedia={shareMediaFile}
                onStopSharingMedia={stopSharingMedia}
                isSharingMedia={isSharingMedia}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                onToggleChat={() => setIsChatVisible(!isChatVisible)}
                isChatVisible={isChatVisible}
           />
        </div>
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-gray-900 flex items-center justify-center font-sans relative">
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
      {callState !== 'connected' ? renderLobby() : renderCallView()}
    </main>
  );
}