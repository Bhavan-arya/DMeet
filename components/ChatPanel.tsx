import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, SendIcon } from './Icons';

export type Message = {
    id: number;
    text: string;
    sender: 'me' | 'remote';
};

interface ChatPanelProps {
    messages: Message[];
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isOpen, onClose, onSendMessage }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div 
            className={`absolute top-0 right-0 h-full w-full sm:w-80 bg-gray-900/80 backdrop-blur-lg border-l border-gray-700/50 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Chat</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                        msg.sender === 'me' 
                                            ? 'bg-cyan-600 text-white rounded-br-lg' 
                                            : 'bg-gray-700 text-gray-200 rounded-bl-lg'
                                    }`}
                                >
                                    <p className="text-sm break-words">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        <button type="submit" className="w-12 h-12 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                            <SendIcon className="w-6 h-6 text-white" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};