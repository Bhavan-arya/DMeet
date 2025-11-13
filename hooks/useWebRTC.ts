import { useState, useRef, useCallback, useEffect } from 'react';
import { PEER_CONNECTION_CONFIG } from '../constants';

type SignalingPayload = {
    sdp: RTCSessionDescriptionInit;
    candidates: RTCIceCandidateInit[];
};

type UseWebRTCOptions = {
    onChatMessage?: (message: string) => void;
};

export const useWebRTC = ({ onChatMessage }: UseWebRTCOptions = {}) => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const sharedMediaStreamRef = useRef<MediaStream | null>(null);
    const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
    const mediaFileVideoSenderRef = useRef<RTCRtpSender | null>(null);
    const mediaFileAudioSenderRef = useRef<RTCRtpSender | null>(null);
    const mediaElementRef = useRef<HTMLVideoElement | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [sharedMediaStream, setSharedMediaStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    const [isSharingMedia, setIsSharingMedia] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
    const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
    const [remoteDisplayName, setRemoteDisplayName] = useState<string>('');

    const clearError = useCallback(() => setError(null), []);

    const sendData = useCallback((data: object) => {
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            dataChannelRef.current.send(JSON.stringify(data));
        } else {
            console.warn('Data channel is not open, cannot send data.');
        }
    }, []);

    const initializePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        try {
            const pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

            pc.ontrack = (event) => {
                const newRemoteStream = new MediaStream();
                event.streams[0].getTracks().forEach(track => {
                    newRemoteStream.addTrack(track);
                });
                setRemoteStream(newRemoteStream);
            };

            pc.onconnectionstatechange = () => {
                setConnectionState(pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setIsConnected(true);
                    clearError();
                } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                    setIsConnected(false);
                    setRemoteStream(null);
                    setRemoteDisplayName('');
                    if (pc.connectionState === 'failed') {
                        setError("Connection failed. Please try again.");
                    }
                }
            };
            
            pc.ondatachannel = (event) => {
                const channel = event.channel;
                dataChannelRef.current = channel;
                channel.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'displayName') {
                            setRemoteDisplayName(data.payload);
                        } else if (data.type === 'chat' && onChatMessage) {
                            onChatMessage(data.payload);
                        }
                    } catch (e) {
                        console.error('Failed to parse data channel message:', e);
                    }
                };
            };

            peerConnectionRef.current = pc;
            return pc;
        } catch (e) {
            console.error("Failed to create RTCPeerConnection", e);
            setError("Failed to create peer connection. Your browser might not support WebRTC.");
            return null;
        }
    }, [clearError, onChatMessage]);

    const startLocalStream = useCallback(async () => {
        if (localStreamRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            localVideoTrackRef.current = stream.getVideoTracks()[0];
            localAudioTrackRef.current = stream.getAudioTracks()[0];
            setLocalStream(stream);
        } catch (e) {
            console.error("Error accessing media devices.", e);
            setError("Could not access camera and microphone. Please grant permission.");
            throw e;
        }
    }, []);

    const createOffer = useCallback(async (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            const pc = initializePeerConnection();
            if (!pc || !localStreamRef.current) return reject(new Error("Local stream not started"));
            
            const dataChannel = pc.createDataChannel('userData');
            dataChannelRef.current = dataChannel;

            const candidates: RTCIceCandidateInit[] = [];
            let iceGatheringComplete = false;
            
            // Timeout for ICE gathering (15 seconds)
            const iceTimeout = setTimeout(() => {
                if (!iceGatheringComplete) {
                    iceGatheringComplete = true;
                    // Resolve with whatever candidates we have
                    const payload: SignalingPayload = {
                        sdp: pc.localDescription!.toJSON(),
                        candidates: candidates
                    };
                    resolve(btoa(JSON.stringify(payload)));
                }
            }, 15000);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    candidates.push(event.candidate.toJSON());
                } else {
                    // ICE gathering complete
                    if (!iceGatheringComplete) {
                        iceGatheringComplete = true;
                        clearTimeout(iceTimeout);
                        const payload: SignalingPayload = {
                            sdp: pc.localDescription!.toJSON(),
                            candidates: candidates
                        };
                        resolve(btoa(JSON.stringify(payload)));
                    }
                }
            };
            
            pc.oniceconnectionstatechange = () => {
                if(pc.iceConnectionState === 'failed') {
                    clearTimeout(iceTimeout);
                    setError("Network connection failed. Please check your connection.");
                    reject(new Error("ICE gathering failed"));
                }
            }

            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
            } catch (err) {
                clearTimeout(iceTimeout);
                reject(err);
            }
        });
    }, [initializePeerConnection]);

    const createAnswer = useCallback(async (offerCode: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            const pc = initializePeerConnection();
            if (!pc || !localStreamRef.current) return reject(new Error("Local stream not started"));

            const candidates: RTCIceCandidateInit[] = [];
            let iceGatheringComplete = false;
            
            // Timeout for ICE gathering (15 seconds)
            const iceTimeout = setTimeout(() => {
                if (!iceGatheringComplete) {
                    iceGatheringComplete = true;
                    // Resolve with whatever candidates we have
                    const payload: SignalingPayload = {
                        sdp: pc.localDescription!.toJSON(),
                        candidates: candidates
                    };
                    resolve(btoa(JSON.stringify(payload)));
                }
            }, 15000);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    candidates.push(event.candidate.toJSON());
                } else {
                    // ICE gathering complete
                    if (!iceGatheringComplete) {
                        iceGatheringComplete = true;
                        clearTimeout(iceTimeout);
                        const payload: SignalingPayload = {
                            sdp: pc.localDescription!.toJSON(),
                            candidates: candidates
                        };
                        resolve(btoa(JSON.stringify(payload)));
                    }
                }
            };

            pc.oniceconnectionstatechange = () => {
                if(pc.iceConnectionState === 'failed') {
                    clearTimeout(iceTimeout);
                    setError("Network connection failed. Please check your connection.");
                    reject(new Error("ICE gathering failed"));
                }
            }

            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

            try {
                const offerPayload: SignalingPayload = JSON.parse(atob(offerCode));
                await pc.setRemoteDescription(new RTCSessionDescription(offerPayload.sdp));
                
                // Add ICE candidates as they arrive (better than adding all at once)
                for (const candidate of offerPayload.candidates) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        // Ignore individual candidate errors, continue with others
                        console.warn('Failed to add ICE candidate:', e);
                    }
                }
                
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
            } catch (err) {
                clearTimeout(iceTimeout);
                reject(err);
            }
        });
    }, [initializePeerConnection]);
    
    const acceptAnswer = useCallback(async (answerCode: string) => {
        if (!peerConnectionRef.current) throw new Error("Peer connection not initialized");
        try {
            const answerPayload: SignalingPayload = JSON.parse(atob(answerCode));
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answerPayload.sdp));
            
            // Add ICE candidates with error handling
            for (const candidate of answerPayload.candidates) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    // Ignore individual candidate errors, continue with others
                    console.warn('Failed to add ICE candidate:', e);
                }
            }
            
            // Set a timeout to detect if connection is taking too long
            const connectionTimeout = setTimeout(() => {
                if (peerConnectionRef.current && 
                    peerConnectionRef.current.connectionState !== 'connected' && 
                    peerConnectionRef.current.connectionState !== 'connecting') {
                    setError("Connection is taking longer than expected. Please check your network and try again.");
                }
            }, 30000); // 30 seconds
            
            // Clear timeout when connected (using existing onconnectionstatechange handler)
            const originalHandler = peerConnectionRef.current.onconnectionstatechange;
            peerConnectionRef.current.onconnectionstatechange = () => {
                if (originalHandler) originalHandler();
                if (peerConnectionRef.current && peerConnectionRef.current.connectionState === 'connected') {
                    clearTimeout(connectionTimeout);
                }
            };
        } catch (err) {
            console.error("Failed to accept answer:", err);
            setError("Invalid Join Code provided.");
        }
    }, []);

    const shareMediaFile = useCallback(async (file: File) => {
        if (!peerConnectionRef.current) return;

        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.play().catch(e => console.error("Media playback failed", e));
        mediaElementRef.current = videoElement;

        const mediaStream = (videoElement as any).captureStream();
        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];

        if (videoTrack) {
            const videoSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
            if (videoSender) {
                await videoSender.replaceTrack(videoTrack);
                mediaFileVideoSenderRef.current = videoSender;
            }
        }
        if (audioTrack) {
            const audioSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'audio');
            if (audioSender) {
                await audioSender.replaceTrack(audioTrack);
                mediaFileAudioSenderRef.current = audioSender;
            }
        }

        sharedMediaStreamRef.current = mediaStream;
        setSharedMediaStream(mediaStream);
        setIsSharingMedia(true);
    }, []);

    const stopSharingMedia = useCallback(async () => {
        if (!isSharingMedia) return;

        if (mediaFileVideoSenderRef.current && localVideoTrackRef.current) {
            await mediaFileVideoSenderRef.current.replaceTrack(localVideoTrackRef.current);
        }
        if (mediaFileAudioSenderRef.current && localAudioTrackRef.current) {
            await mediaFileAudioSenderRef.current.replaceTrack(localAudioTrackRef.current);
        }
        
        if (mediaElementRef.current) {
            mediaElementRef.current.pause();
            URL.revokeObjectURL(mediaElementRef.current.src);
            mediaElementRef.current = null;
        }

        if (sharedMediaStreamRef.current) {
            sharedMediaStreamRef.current.getTracks().forEach(track => track.stop());
            sharedMediaStreamRef.current = null;
        }
        
        setSharedMediaStream(null);
        setIsSharingMedia(false);
        mediaFileVideoSenderRef.current = null;
        mediaFileAudioSenderRef.current = null;
    }, [isSharingMedia]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const enabled = isAudioMuted;
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            setIsAudioMuted(!enabled);
        }
    }, [isAudioMuted]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const enabled = isVideoMuted;
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            setIsVideoMuted(!enabled);
        }
    }, [isVideoMuted]);

    const hangUp = useCallback(() => {
        stopSharingMedia();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setConnectionState('closed');
        setError(null);
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        setRemoteDisplayName('');
    }, [stopSharingMedia]);

    useEffect(() => {
        return () => {
            hangUp();
        };
    }, [hangUp]);


    return {
        localStream,
        remoteStream,
        sharedMediaStream,
        isConnected,
        connectionState,
        isSharingMedia,
        error,
        clearError,
        isAudioMuted,
        isVideoMuted,
        remoteDisplayName,
        startLocalStream,
        createOffer,
        createAnswer,
        acceptAnswer,
        hangUp,
        shareMediaFile,
        stopSharingMedia,
        toggleAudio,
        toggleVideo,
        sendData,
    };
};