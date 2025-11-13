import React, { useState, useEffect } from 'react';
import { CopyIcon, PasteIcon, BackIcon, SpinnerIcon } from './Icons';

interface SignalingManagerProps {
    startLocalStream: () => Promise<void>;
    hasStream: boolean;
    createOffer: () => Promise<string>;
    createAnswer: (offerCode: string) => Promise<string>;
    acceptAnswer: (answerCode: string) => Promise<void>;
    isReady: boolean;
}

type Mode = 'select' | 'create' | 'join';

const SignalingCodeBox: React.FC<{ title: string; value: string; placeholder: string; onValueChange?: (text: string) => void; readOnly?: boolean; }> = ({ title, value, placeholder, onValueChange, readOnly = false }) => {
    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pasteFromClipboard = async () => {
        if(onValueChange) {
            try {
                const text = await navigator.clipboard.readText();
                onValueChange(text);
            } catch (err) {
                console.error("Failed to read clipboard contents: ", err);
                alert("Could not paste from clipboard. Please paste manually.");
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">{title}</label>
            <div className="relative">
                <textarea
                    readOnly={readOnly}
                    value={value}
                    onChange={(e) => onValueChange?.(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-24 p-2 pr-12 bg-gray-900 border border-gray-600 rounded-md resize-none text-xs text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                 <div className="absolute top-2 right-2 flex gap-1">
                    {value && readOnly && (
                        <button onClick={copyToClipboard} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" title="Copy">
                            <CopyIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    )}
                    {!readOnly && (
                         <button onClick={pasteFromClipboard} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" title="Paste">
                            <PasteIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    )}
                </div>
                 {copied && <span className="absolute bottom-2 left-2 text-xs text-cyan-400">Copied!</span>}
            </div>
        </div>
    );
};

export const SignalingManager: React.FC<SignalingManagerProps> = ({ hasStream, startLocalStream, createOffer, createAnswer, acceptAnswer, isReady }) => {
    const [mode, setMode] = useState<Mode>('select');
    const [isLoading, setIsLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const handleReset = () => {
        setMode('select');
        setError('');
        setInviteCode('');
        setJoinCode('');
    };

    const handleCreate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const offer = await createOffer();
            setInviteCode(offer);
            setMode('create');
        } catch (e) {
            console.error(e);
            setError("Failed to create call offer. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            setError("Please paste the invite code first.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const answer = await createAnswer(inviteCode);
            setJoinCode(answer);
        } catch (e) {
            console.error(e);
            setError("Invalid invite code or failed to create answer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!joinCode.trim()) {
            setError("Please paste the join code first.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await acceptAnswer(joinCode);
        } catch (e) {
            console.error(e);
            setError("Failed to connect. The join code might be invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    const backButton = (
         <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2">
            <BackIcon className="w-4 h-4" /> Back
        </button>
    );

    if (mode === 'select') {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 mt-auto">
                <button onClick={handleCreate} disabled={isLoading || !isReady} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Starting...' : 'Create New Call'}
                </button>
                <button onClick={() => setMode('join')} disabled={isLoading || !isReady} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    Join Call with Code
                </button>
                {!hasStream && <p className="text-xs text-gray-400 text-center mt-2">Please turn on your camera and mic first.</p>}
                {hasStream && !isReady && <p className="text-xs text-yellow-400 text-center mt-2">Please enter your name to proceed.</p>}
            </div>
        );
    }
    
    if (mode === 'create') {
        return (
            <div className="flex flex-col gap-4">
                {backButton}
                <h3 className="text-lg font-semibold text-center text-white -mb-2">Create a Call</h3>
                <SignalingCodeBox title="Step 1: Send this Invite Code" value={inviteCode} placeholder="Generating code..." readOnly={true}/>
                <SignalingCodeBox title="Step 2: Paste Partner's Code Here" value={joinCode} onValueChange={setJoinCode} placeholder="Paste code from partner..." />
                <button onClick={handleConnect} disabled={isLoading || !joinCode.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Connecting...' : 'Connect'}
                </button>
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
        );
    }
    
    if (mode === 'join') {
        return (
             <div className="flex flex-col gap-4">
                {backButton}
                 <h3 className="text-lg font-semibold text-center text-white -mb-2">Join a Call</h3>
                {!joinCode ? (
                    <>
                        <SignalingCodeBox title="Step 1: Paste Invite Code" value={inviteCode} onValueChange={setInviteCode} placeholder="Paste code from partner..." />
                        <button onClick={handleJoin} disabled={isLoading || !inviteCode.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Generating...' : 'Generate Your Join Code'}
                        </button>
                    </>
                ) : (
                    <>
                         <SignalingCodeBox title="Step 2: Send this Code Back" value={joinCode} placeholder="" readOnly={true} />
                         <div className="text-center text-gray-400 p-4 border border-dashed border-gray-600 rounded-lg">
                            <div className="flex items-center justify-center gap-2">
                                <SpinnerIcon className="w-5 h-5 animate-spin"/>
                                <p className="font-semibold">Waiting for partner to connect...</p>
                            </div>
                            <p className="text-sm mt-2">Your part is done! The call will start automatically once they use your code.</p>
                         </div>
                    </>
                )}
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
        );
    }

    return null;
};
